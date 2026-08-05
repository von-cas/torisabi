import Link from "next/link";
import { OrderForm } from "@/components/admin/order-form";
import {
  OrderInvoice,
  type OrderInvoiceRow,
} from "@/components/admin/order-invoice";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/lib/types";
import { loadPickerProducts } from "../products";

export const dynamic = "force-dynamic";

async function loadOrder(id: string): Promise<{
  order: Order | null;
  items: OrderItem[];
  invoice: OrderInvoiceRow | null;
}> {
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!data) return { order: null, items: [], invoice: null };

    const [items, invoice] = await Promise.all([
      supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("invoices")
        .select("id, invoice_number, invoice_date")
        .eq("order_id", id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      order: data as Order,
      items: (items.data ?? []) as OrderItem[],
      invoice: (invoice.data as OrderInvoiceRow | null) ?? null,
    };
  } catch {
    return { order: null, items: [], invoice: null };
  }
}

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ order, items, invoice }, products] = await Promise.all([
    loadOrder(id),
    loadPickerProducts(),
  ]);

  if (!order) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        This order could not be loaded.{" "}
        <Link href="/admin/orders" className="underline">
          Back to orders
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <OrderForm order={order} items={items} products={products} />
      <OrderInvoice orderId={order.id} invoice={invoice} />
    </div>
  );
}
