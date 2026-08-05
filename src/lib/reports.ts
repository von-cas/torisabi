/**
 * Money aggregation for the profit reports (MASTER-PLAN.md §5).
 *
 * Pure functions over plain rows — no Supabase, no React, no `Date` beyond the
 * `YYYY-MM-DD` strings a Postgres `date` column returns. Every amount is an
 * integer number of centavos and is only ever added, subtracted or multiplied,
 * so no float ever touches money.
 *
 * Dates are compared as strings: `YYYY-MM-DD` sorts lexicographically in
 * calendar order, which sidesteps timezone drift entirely.
 */

export const PERIOD_PRESETS = [
  "today",
  "this-week",
  "this-month",
  "last-month",
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export interface DateRange {
  /** Inclusive `YYYY-MM-DD`. */
  from: string;
  /** Inclusive `YYYY-MM-DD`. */
  to: string;
}

export function isPeriodPreset(value: unknown): value is PeriodPreset {
  return PERIOD_PRESETS.includes(value as PeriodPreset);
}

// ------------------------------------------------------------------ dates

const DAY_MS = 86_400_000;

function toMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function toIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  return toIso(toMs(date) + days * DAY_MS);
}

/** 0 = Sunday … 6 = Saturday. */
function weekday(date: string): number {
  return new Date(toMs(date)).getUTCDay();
}

/** `"2026-08"` → the first and last day of that month. */
export function monthRange(month: string): DateRange {
  const year = Number(month.slice(0, 4));
  const number = Number(month.slice(5, 7)); // 1-based
  // Day 0 of the following month is the last day of this one.
  const lastDay = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function shiftMonth(month: string, by: number): string {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7)) - 1; // 0-based
  return new Date(Date.UTC(year, index + by, 1)).toISOString().slice(0, 7);
}

/**
 * Inclusive range for a preset, or a custom `{from, to}` passed straight
 * through. Weeks run Monday–Sunday.
 */
export function periodRange(
  preset: PeriodPreset | DateRange,
  today: string,
): DateRange {
  if (typeof preset !== "string") {
    // Dates picked in the wrong order are a slip, not an empty period.
    return preset.from <= preset.to
      ? { from: preset.from, to: preset.to }
      : { from: preset.to, to: preset.from };
  }

  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "this-week": {
      const monday = addDays(today, -((weekday(today) + 6) % 7));
      return { from: monday, to: addDays(monday, 6) };
    }
    case "last-month":
      return monthRange(shiftMonth(today.slice(0, 7), -1));
    case "this-month":
    default:
      return monthRange(today.slice(0, 7));
  }
}

/** The last `count` months ending with the one `today` falls in, oldest first. */
export function recentMonths(
  today: string,
  count: number,
): (DateRange & { month: string })[] {
  const current = today.slice(0, 7);
  const months: (DateRange & { month: string })[] = [];
  for (let back = count - 1; back >= 0; back -= 1) {
    const month = shiftMonth(current, -back);
    months.push({ month, ...monthRange(month) });
  }
  return months;
}

export function inRange(date: string, range: DateRange): boolean {
  return date >= range.from && date <= range.to;
}

// ------------------------------------------------------------------ money

/**
 * Postgres `bigint` can arrive as a number or a string depending on the driver;
 * either way the result has to be a whole number of centavos.
 */
function centavos(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

export interface SummaryOrder {
  payment_state: string;
  final_amount_centavos: number;
  shipping_fee_centavos: number;
}

export interface SummaryExpense {
  category: string;
  amount_centavos: number;
}

export interface Summary {
  salesCentavos: number;
  shippingCentavos: number;
  expensesCentavos: number;
  profitCentavos: number;
  byCategory: Record<string, number>;
}

/**
 * Totals for one period. Only paid orders count as sales — an inquiry that was
 * never paid is not revenue. `salesCentavos` is the final amount charged, so it
 * already contains the shipping reported separately in `shippingCentavos`.
 */
export function summarise({
  orders,
  expenses,
}: {
  orders: SummaryOrder[];
  expenses: SummaryExpense[];
}): Summary {
  let salesCentavos = 0;
  let shippingCentavos = 0;
  for (const order of orders) {
    if (order.payment_state !== "paid") continue;
    salesCentavos += centavos(order.final_amount_centavos);
    shippingCentavos += centavos(order.shipping_fee_centavos);
  }

  let expensesCentavos = 0;
  const byCategory: Record<string, number> = {};
  for (const expense of expenses) {
    const amount = centavos(expense.amount_centavos);
    expensesCentavos += amount;
    const category = expense.category || "other";
    byCategory[category] = (byCategory[category] ?? 0) + amount;
  }

  return {
    salesCentavos,
    shippingCentavos,
    expensesCentavos,
    profitCentavos: salesCentavos - expensesCentavos,
    byCategory,
  };
}

export interface MarginInput {
  product_name: string;
  quantity: number;
  unit_price_centavos: number;
  unit_cost_centavos: number | null;
}

export interface ItemMargin {
  name: string;
  revenue: number;
  cost: number;
  margin: number;
}

/**
 * Margin per product sold, biggest first. Items sold more than once are added
 * together. Items with no recorded cost are skipped: reporting their whole sale
 * price as margin would overstate profit.
 */
export function itemMargins(orderItems: MarginInput[]): ItemMargin[] {
  const rows = new Map<string, ItemMargin>();

  for (const item of orderItems) {
    if (item.unit_cost_centavos === null || item.unit_cost_centavos === undefined) {
      continue;
    }
    const quantity = centavos(item.quantity);
    if (quantity <= 0) continue;

    const revenue = quantity * centavos(item.unit_price_centavos);
    const cost = quantity * centavos(item.unit_cost_centavos);
    const existing = rows.get(item.product_name);
    if (existing) {
      existing.revenue += revenue;
      existing.cost += cost;
      existing.margin = existing.revenue - existing.cost;
    } else {
      rows.set(item.product_name, {
        name: item.product_name,
        revenue,
        cost,
        margin: revenue - cost,
      });
    }
  }

  return [...rows.values()].sort(
    (a, b) => b.margin - a.margin || a.name.localeCompare(b.name),
  );
}
