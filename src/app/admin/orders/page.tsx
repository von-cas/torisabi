import { OrderTable, type AdminOrderRow } from "@/components/admin/order-table";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function loadOrders(): Promise<{
  orders: AdminOrderRow[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, order_date, customer_name, final_amount_centavos, status, payment_state",
      )
      .order("order_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) return { orders: [], error: error.message };
    return { orders: (data ?? []) as AdminOrderRow[], error: null };
  } catch {
    return { orders: [], error: "the database is not configured yet" };
  }
}

export default async function AdminOrdersPage() {
  const { orders, error } = await loadOrders();
  return <OrderTable orders={orders} loadError={error} />;
}
