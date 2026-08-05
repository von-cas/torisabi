import { ReportView, type TrendMonth } from "@/components/admin/report-view";
import {
  inRange,
  isPeriodPreset,
  itemMargins,
  periodRange,
  recentMonths,
  summarise,
  type DateRange,
  type MarginInput,
  type SummaryExpense,
  type SummaryOrder,
} from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";

/** Profit reports (MASTER-PLAN.md §5, task T2.4). */

export const dynamic = "force-dynamic";

const MANILA = "Asia/Manila";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TREND_MONTHS = 6;

/** Today in Manila as YYYY-MM-DD — the server clock runs in UTC. */
function manilaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

type OrderRow = SummaryOrder & { id: string; order_date: string };
type ExpenseRow = SummaryExpense & { expense_date: string };

interface Loaded {
  orders: OrderRow[];
  expenses: ExpenseRow[];
  items: MarginInput[];
  offline: boolean;
}

/**
 * One pass over the widest span any section needs — the chosen period and the
 * six-month trend — then the rows are bucketed in memory. The shop's row counts
 * are small; a round trip to Singapore is the expensive part.
 */
async function load(span: DateRange, period: DateRange): Promise<Loaded> {
  try {
    const supabase = await createClient();

    const [orders, expenses] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, order_date, payment_state, final_amount_centavos, shipping_fee_centavos",
        )
        .gte("order_date", span.from)
        .lte("order_date", span.to),
      supabase
        .from("expenses")
        .select("expense_date, category, amount_centavos")
        .gte("expense_date", span.from)
        .lte("expense_date", span.to),
    ]);

    const orderRows = (orders.data ?? []) as OrderRow[];
    const paidIds = orderRows
      .filter(
        (order) =>
          order.payment_state === "paid" && inRange(order.order_date, period),
      )
      .map((order) => order.id);

    let items: MarginInput[] = [];
    if (paidIds.length > 0) {
      const { data } = await supabase
        .from("order_items")
        .select(
          "product_name, quantity, unit_price_centavos, unit_cost_centavos",
        )
        .in("order_id", paidIds);
      items = (data ?? []) as MarginInput[];
    }

    return {
      orders: orderRows,
      expenses: (expenses.data ?? []) as ExpenseRow[],
      items,
      // Either half missing makes the profit figure wrong, so say so rather
      // than presenting a confident number built on one table.
      offline: Boolean(orders.error || expenses.error),
    };
  } catch {
    return { orders: [], expenses: [], items: [], offline: true };
  }
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const today = manilaToday();

  const from = params.from ?? "";
  const to = params.to ?? "";
  const custom =
    params.period === "custom" && ISO_DATE.test(from) && ISO_DATE.test(to)
      ? { from, to }
      : null;
  const preset = isPeriodPreset(params.period) ? params.period : "this-month";
  const period = periodRange(custom ?? preset, today);

  const months = recentMonths(today, TREND_MONTHS);
  const trendStart = months[0].from;
  const trendEnd = months[months.length - 1].to;
  const span = {
    from: trendStart < period.from ? trendStart : period.from,
    to: trendEnd > period.to ? trendEnd : period.to,
  };

  const { orders, expenses, items, offline } = await load(span, period);

  const summary = summarise({
    orders: orders.filter((order) => inRange(order.order_date, period)),
    expenses: expenses.filter((expense) =>
      inRange(expense.expense_date, period),
    ),
  });

  const trend: TrendMonth[] = months.map((bucket) => {
    const totals = summarise({
      orders: orders.filter((order) => inRange(order.order_date, bucket)),
      expenses: expenses.filter((expense) =>
        inRange(expense.expense_date, bucket),
      ),
    });
    return {
      month: bucket.month,
      sales: totals.salesCentavos,
      expenses: totals.expensesCentavos,
      profit: totals.profitCentavos,
    };
  });

  return (
    <ReportView
      active={custom ? "custom" : preset}
      range={period}
      summary={summary}
      margins={itemMargins(items)}
      trend={trend}
      offline={offline}
    />
  );
}
