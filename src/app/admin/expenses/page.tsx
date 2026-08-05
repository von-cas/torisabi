import {
  ExpenseTracker,
  type ExpenseRow,
  type LinkOption,
} from "@/components/admin/expense-tracker";
import { createClient } from "@/lib/supabase/server";

/** Expenses (MASTER-PLAN.md §5, task T2.3). */

export const dynamic = "force-dynamic";

const MANILA = "Asia/Manila";

/** Today in Manila as YYYY-MM-DD — the server clock runs in UTC. */
function manilaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

interface Loaded {
  expenses: ExpenseRow[];
  products: LinkOption[];
  orders: LinkOption[];
  error: string | null;
}

async function load(): Promise<Loaded> {
  try {
    const supabase = await createClient();

    const [expenses, products, orders] = await Promise.all([
      supabase
        .from("expenses")
        .select(
          "id, expense_date, category, payee, description, amount_centavos, payment_method, receipt_reference, related_order_id, related_product_id, source, needs_review, notes, created_at",
        )
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("products")
        .select("id, code, name")
        .is("archived_at", null)
        .order("code", { ascending: true }),
      supabase
        .from("orders")
        .select("id, order_number, customer_name")
        .order("order_date", { ascending: false })
        .limit(50),
    ]);

    return {
      expenses: (expenses.data ?? []) as ExpenseRow[],
      products: (
        (products.data ?? []) as { id: string; code: string; name: string }[]
      ).map((product) => ({
        id: product.id,
        label: `${product.code} · ${product.name}`,
      })),
      orders: (
        (orders.data ?? []) as {
          id: string;
          order_number: string;
          customer_name: string;
        }[]
      ).map((order) => ({
        id: order.id,
        label: `${order.order_number} · ${order.customer_name}`,
      })),
      error: expenses.error?.message ?? null,
    };
  } catch {
    return {
      expenses: [],
      products: [],
      orders: [],
      error: "the database is not configured yet",
    };
  }
}

export default async function AdminExpensesPage() {
  const { expenses, products, orders, error } = await load();

  return (
    <ExpenseTracker
      expenses={expenses}
      products={products}
      orders={orders}
      today={manilaToday()}
      loadError={error}
    />
  );
}
