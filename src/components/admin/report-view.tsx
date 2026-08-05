import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { formatPeso } from "@/lib/money";
import type { DateRange, ItemMargin, PeriodPreset, Summary } from "@/lib/reports";
import { cn } from "@/lib/utils";

/**
 * Profit reports (MASTER-PLAN.md §5, task T2.4). Presentation only — every
 * number arrives already computed by `src/lib/reports.ts`.
 *
 * The period lives in the URL, so this whole screen is server-rendered: the
 * preset buttons are links and the custom range is a plain GET form. No client
 * JavaScript, which is what keeps it quick on a phone.
 */

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "this-week", label: "This week" },
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
];

export interface TrendMonth {
  month: string;
  sales: number;
  expenses: number;
  profit: number;
}

function day(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function month(value: string): string {
  const parsed = new Date(`${value}-01T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "UTC",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function ReportView({
  active,
  range,
  summary,
  margins,
  trend,
  offline,
}: {
  active: PeriodPreset | "custom";
  range: DateRange;
  summary: Summary;
  margins: ItemMargin[];
  trend: TrendMonth[];
  offline: boolean;
}) {
  const categories = Object.entries(summary.byCategory).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h1 className="text-base font-semibold tracking-tight">Reports</h1>
        <span className="text-xs text-muted-foreground">
          {range.from === range.to
            ? day(range.from)
            : `${day(range.from)} – ${day(range.to)}`}
        </span>
      </div>

      {offline ? (
        <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-2.5 text-xs text-muted-foreground">
          <TriangleAlert className="mt-px size-3.5 shrink-0" />
          Some figures could not be read from the database, so these totals may
          be incomplete.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex overflow-hidden rounded-md border border-border">
          {PRESETS.map((preset) => (
            <Link
              key={preset.value}
              href={`/admin/reports?period=${preset.value}`}
              aria-current={active === preset.value ? "page" : undefined}
              className={cn(
                "flex h-11 items-center border-l border-border px-3 text-xs first:border-l-0 md:h-9",
                active === preset.value
                  ? "bg-muted font-medium"
                  : "text-muted-foreground",
              )}
            >
              {preset.label}
            </Link>
          ))}
        </div>

        <form method="get" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="period" value="custom" />
          <div>
            <label
              className="mb-1 block text-[11px] text-muted-foreground"
              htmlFor="from"
            >
              From
            </label>
            <input
              id="from"
              type="date"
              name="from"
              defaultValue={range.from}
              className="h-11 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-ring md:h-9"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-[11px] text-muted-foreground"
              htmlFor="to"
            >
              To
            </label>
            <input
              id="to"
              type="date"
              name="to"
              defaultValue={range.to}
              className="h-11 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-ring md:h-9"
            />
          </div>
          <button
            type="submit"
            className={cn(
              "h-11 rounded-md border border-border px-3 text-xs md:h-9",
              active === "custom" ? "bg-muted font-medium" : "",
            )}
          >
            Apply range
          </button>
        </form>
      </div>

      <div className="grid gap-2 lg:grid-cols-[1.1fr_2fr]">
        <div
          className={cn(
            "flex min-h-[88px] flex-col justify-center rounded-lg border-2 p-3",
            summary.profitCentavos < 0
              ? "border-destructive/40 bg-destructive/5"
              : "border-brand/40 bg-brand-soft/30",
          )}
        >
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Profit
          </div>
          <div
            className={cn(
              "mt-0.5 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl",
              summary.profitCentavos < 0 && "text-destructive",
            )}
          >
            {formatPeso(summary.profitCentavos)}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Sales − expenses
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Tile label="Sales" value={formatPeso(summary.salesCentavos)} />
          <Tile
            label="Shipping collected"
            value={formatPeso(summary.shippingCentavos)}
          />
          <Tile label="Expenses" value={formatPeso(summary.expensesCentavos)} />
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card">
        <h2 className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Expenses by category
        </h2>
        {categories.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            No expenses in this period.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map(([name, amount]) => {
              // Share of the period's spend. Display only — the money above
              // stays in whole centavos.
              const share = summary.expensesCentavos
                ? (amount * 100) / summary.expensesCentavos
                : 0;
              return (
                <li key={name} className="px-3 py-2">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{name}</span>
                    <span className="shrink-0 tabular-nums">
                      {formatPeso(amount)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${Math.max(share, 2)}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                      {Math.round(share)}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card">
        <h2 className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Margin per item sold
        </h2>
        {margins.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            Nothing with a recorded cost price was sold in this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="border-b border-border px-3 py-1.5 font-medium">
                    Item
                  </th>
                  <th className="border-b border-border px-2 py-1.5 text-right font-medium">
                    Revenue
                  </th>
                  <th className="border-b border-border px-2 py-1.5 text-right font-medium">
                    Cost
                  </th>
                  <th className="border-b border-border px-3 py-1.5 text-right font-medium">
                    Margin
                  </th>
                </tr>
              </thead>
              <tbody>
                {margins.map((item) => (
                  <tr key={item.name}>
                    <td className="max-w-0 border-b border-border px-3 py-1.5">
                      <div className="truncate">{item.name}</div>
                    </td>
                    <td className="border-b border-border px-2 py-1.5 text-right tabular-nums">
                      {formatPeso(item.revenue)}
                    </td>
                    <td className="border-b border-border px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                      {formatPeso(item.cost)}
                    </td>
                    <td
                      className={cn(
                        "border-b border-border px-3 py-1.5 text-right font-medium tabular-nums",
                        item.margin < 0 && "text-destructive",
                      )}
                    >
                      {formatPeso(item.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card">
        <h2 className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Last 6 months
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-xs sm:text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="border-b border-border px-3 py-1.5 font-medium">
                  Month
                </th>
                <th className="border-b border-border px-2 py-1.5 text-right font-medium">
                  Sales
                </th>
                <th className="border-b border-border px-2 py-1.5 text-right font-medium">
                  Expenses
                </th>
                <th className="border-b border-border px-3 py-1.5 text-right font-medium">
                  Profit
                </th>
              </tr>
            </thead>
            <tbody>
              {trend.map((row) => (
                <tr key={row.month}>
                  <td className="border-b border-border px-3 py-1.5 whitespace-nowrap">
                    {month(row.month)}
                  </td>
                  <td className="border-b border-border px-2 py-1.5 text-right tabular-nums">
                    {formatPeso(row.sales)}
                  </td>
                  <td className="border-b border-border px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                    {formatPeso(row.expenses)}
                  </td>
                  <td
                    className={cn(
                      "border-b border-border px-3 py-1.5 text-right font-medium tabular-nums",
                      row.profit < 0 && "text-destructive",
                    )}
                  >
                    {formatPeso(row.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[64px] flex-col justify-center rounded-lg border border-border bg-card p-2.5">
      <div className="text-[10px] leading-tight text-muted-foreground sm:text-[11px]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold tabular-nums tracking-tight sm:text-base">
        {value}
      </div>
    </div>
  );
}
