import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { formatPeso } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_STATUS_LABELS, type ProductStatus } from "@/lib/types";

/**
 * Dashboard home (MASTER-PLAN.md §5): the whole business at a glance.
 * Orders and expenses land in Phase 2, so every tile has to read ₱0.00 happily
 * — and the whole load degrades to zeros if Supabase is unreachable.
 */

export const dynamic = "force-dynamic";

const MANILA = "Asia/Manila";

interface OrderRow {
  order_date: string;
  final_amount_centavos: number;
  payment_state: string;
}

interface ExpenseRow {
  amount_centavos: number;
}

interface Activity {
  key: string;
  when: string;
  title: string;
  detail: string;
  href?: string;
}

interface Dashboard {
  todaySales: number;
  monthSales: number;
  monthExpenses: number;
  pendingOrders: number;
  drafts: number;
  activity: Activity[];
  offline: boolean;
}

const EMPTY: Dashboard = {
  todaySales: 0,
  monthSales: 0,
  monthExpenses: 0,
  pendingOrders: 0,
  drafts: 0,
  activity: [],
  offline: true,
};

/** Today in Manila as YYYY-MM-DD — the server clock runs in UTC. */
function manilaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function monthBounds(today: string) {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const start = `${today.slice(0, 7)}-01`;
  const next =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return { start, next };
}

function sum(values: number[]) {
  return values.reduce((running, value) => running + Number(value || 0), 0);
}

function shortDate(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA,
    month: "short",
    day: "numeric",
  }).format(parsed);
}

async function loadDashboard(): Promise<Dashboard> {
  try {
    const supabase = await createClient();
    const today = manilaToday();
    const { start, next } = monthBounds(today);

    const [
      monthOrders,
      pendingOrders,
      monthExpenses,
      draftProducts,
      recentProducts,
      recentOrders,
      recentExpenses,
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("order_date, final_amount_centavos, payment_state")
        .gte("order_date", start)
        .lt("order_date", next),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .not("status", "in", "(delivered,cancelled)"),
      supabase
        .from("expenses")
        .select("amount_centavos")
        .gte("expense_date", start)
        .lt("expense_date", next),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft")
        .is("archived_at", null),
      supabase
        .from("products")
        .select("id, name, code, status, created_at")
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("orders")
        .select("id, order_number, customer_name, final_amount_centavos, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("expenses")
        .select("id, payee, category, amount_centavos, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const paid = ((monthOrders.data ?? []) as OrderRow[]).filter(
      (order) => order.payment_state === "paid",
    );

    const products = (recentProducts.data ?? []) as {
      id: string;
      name: string;
      code: string;
      status: ProductStatus;
      created_at: string;
    }[];
    const orders = (recentOrders.data ?? []) as {
      id: string;
      order_number: string;
      customer_name: string;
      final_amount_centavos: number;
      created_at: string;
    }[];
    const expenses = (recentExpenses.data ?? []) as {
      id: string;
      payee: string | null;
      category: string;
      amount_centavos: number;
      created_at: string;
    }[];

    const activity: Activity[] = [
      ...products.map((product) => ({
        key: `product-${product.id}`,
        when: product.created_at,
        title: product.name,
        detail: `${product.code} · ${PRODUCT_STATUS_LABELS[product.status] ?? product.status}`,
        href: `/admin/products/${product.id}`,
      })),
      ...orders.map((order) => ({
        key: `order-${order.id}`,
        when: order.created_at,
        title: `${order.order_number} · ${order.customer_name}`,
        detail: formatPeso(Number(order.final_amount_centavos || 0)),
      })),
      ...expenses.map((expense) => ({
        key: `expense-${expense.id}`,
        when: expense.created_at,
        title: expense.payee ?? expense.category,
        detail: `${expense.category} · ${formatPeso(Number(expense.amount_centavos || 0))}`,
      })),
    ]
      .sort((a, b) => b.when.localeCompare(a.when))
      .slice(0, 6);

    return {
      todaySales: sum(
        paid
          .filter((order) => order.order_date === today)
          .map((order) => order.final_amount_centavos),
      ),
      monthSales: sum(paid.map((order) => order.final_amount_centavos)),
      monthExpenses: sum(
        ((monthExpenses.data ?? []) as ExpenseRow[]).map(
          (expense) => expense.amount_centavos,
        ),
      ),
      pendingOrders: pendingOrders.count ?? 0,
      drafts: draftProducts.count ?? 0,
      activity,
      offline: Boolean(
        monthOrders.error && monthExpenses.error && recentProducts.error,
      ),
    };
  } catch {
    return EMPTY;
  }
}

function Tile({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: string;
  href?: string;
  tone?: "negative";
}) {
  const body = (
    <>
      <div className="text-[11px] leading-tight text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-base font-semibold tabular-nums tracking-tight sm:text-lg ${
          tone === "negative" ? "text-destructive" : ""
        }`}
      >
        {value}
      </div>
    </>
  );

  const className =
    "flex min-h-[64px] flex-col justify-center rounded-lg border border-border bg-card p-2.5";

  return href ? (
    <Link href={href} className={`${className} hover:bg-muted`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default async function AdminDashboardPage() {
  const data = await loadDashboard();
  const profit = data.monthSales - data.monthExpenses;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-base font-semibold tracking-tight">Dashboard</h1>
        <Link
          href="/admin/products/new"
          className="hidden h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground md:inline-flex"
        >
          + New product
        </Link>
      </div>

      {data.offline ? (
        <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-2.5 text-xs text-muted-foreground">
          <TriangleAlert className="mt-px size-3.5 shrink-0" />
          Not connected to the database yet — showing zeros.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Tile label="Today's sales" value={formatPeso(data.todaySales)} />
        <Tile label="This month's sales" value={formatPeso(data.monthSales)} />
        <Tile
          label="This month's expenses"
          value={formatPeso(data.monthExpenses)}
        />
        <Tile
          label="This month's profit"
          value={formatPeso(profit)}
          tone={profit < 0 ? "negative" : undefined}
        />
        <Tile
          label="Pending orders"
          value={String(data.pendingOrders)}
          href="/admin/orders"
        />
        <Tile
          label="Drafts to review"
          value={String(data.drafts)}
          href="/admin/products?filter=draft"
        />
      </div>

      <section className="rounded-lg border border-border bg-card">
        <h2 className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recent activity
        </h2>
        {data.activity.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            Nothing yet.{" "}
            <Link href="/admin/products/new" className="underline">
              Add your first product
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data.activity.map((item) => (
              <li key={item.key}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex min-h-11 items-center justify-between gap-3 px-3 py-2 hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.detail}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {shortDate(item.when)}
                    </span>
                  </Link>
                ) : (
                  <div className="flex min-h-11 items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.detail}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {shortDate(item.when)}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
