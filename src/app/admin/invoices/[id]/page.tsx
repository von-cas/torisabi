import Link from "next/link";
import { InvoicePrintButton } from "@/components/admin/invoice-print-button";
import {
  PAYMENT_STATE_LABELS,
  formatOrderDate,
} from "@/components/admin/order-shared";
import { formatPeso } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import type { Invoice, Order, OrderItem } from "@/lib/types";

/**
 * Printable invoice. Every amount is read THROUGH the order — the schema
 * deliberately does not copy them onto the invoice, so the two can never
 * disagree. The `@media print` rules below hide the admin sidebar and tab bar so
 * a print is just the sheet.
 */

export const dynamic = "force-dynamic";

const PRINT_CSS = `
@page { margin: 14mm; }
@media print {
  aside, nav, .invoice-noprint { display: none !important; }
  main { padding: 0 !important; }
  .invoice-sheet {
    border: 0 !important;
    background: transparent !important;
    padding: 0 !important;
    max-width: none !important;
  }
}
`;

async function loadInvoice(id: string): Promise<{
  invoice: Invoice | null;
  order: Order | null;
  items: OrderItem[];
}> {
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!data) return { invoice: null, order: null, items: [] };
    const invoice = data as Invoice;

    const [order, items] = await Promise.all([
      supabase.from("orders").select("*").eq("id", invoice.order_id).maybeSingle(),
      supabase
        .from("order_items")
        .select("*")
        .eq("order_id", invoice.order_id)
        .order("created_at", { ascending: true }),
    ]);

    return {
      invoice,
      order: (order.data as Order | null) ?? null,
      items: (items.data ?? []) as OrderItem[],
    };
  } catch {
    return { invoice: null, order: null, items: [] };
  }
}

function Line({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-3 ${strong ? "border-t border-border pt-1.5 text-base font-semibold" : "text-sm"}`}
    >
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { invoice, order, items } = await loadInvoice(id);

  if (!invoice || !order) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        This invoice could not be loaded.{" "}
        <Link href="/admin/invoices" className="underline">
          Back to invoices
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <style>{PRINT_CSS}</style>

      <div className="invoice-noprint flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-base font-semibold tracking-tight">
          Invoice {invoice.invoice_number}
        </h1>
        <Link
          href={`/admin/orders/${order.id}`}
          className="flex h-11 items-center rounded-md border border-border px-3 text-sm md:h-9"
        >
          Open order
        </Link>
        <InvoicePrintButton />
      </div>

      <article className="invoice-sheet max-w-3xl space-y-5 rounded-lg border border-border bg-card p-4 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-xl font-semibold tracking-tight">Torisabi</p>
            <p className="text-xs text-muted-foreground">
              Beautiful finds, carefully selected for you
            </p>
          </div>
          <dl className="text-sm sm:text-right">
            <div className="flex gap-2 sm:justify-end">
              <dt className="text-muted-foreground">Invoice</dt>
              <dd className="font-mono">{invoice.invoice_number}</dd>
            </div>
            <div className="flex gap-2 sm:justify-end">
              <dt className="text-muted-foreground">Date</dt>
              <dd>{formatOrderDate(invoice.invoice_date)}</dd>
            </div>
            <div className="flex gap-2 sm:justify-end">
              <dt className="text-muted-foreground">Order</dt>
              <dd className="font-mono">{order.order_number}</dd>
            </div>
          </dl>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Billed to
            </h2>
            <p className="mt-1 text-sm font-medium">{order.customer_name}</p>
            {order.instagram_username ? (
              <p className="text-sm text-muted-foreground">
                {order.instagram_username}
              </p>
            ) : null}
            {order.mobile_number ? (
              <p className="text-sm text-muted-foreground">
                {order.mobile_number}
              </p>
            ) : null}
            {order.delivery_address ? (
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {order.delivery_address}
              </p>
            ) : null}
          </div>

          <div className="sm:text-right">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Payment
            </h2>
            <p className="mt-1 text-sm">
              {order.payment_method ?? "Method not set"}
            </p>
            <p className="text-sm text-muted-foreground">
              {PAYMENT_STATE_LABELS[order.payment_state]} ·{" "}
              {ORDER_STATUS_LABELS[order.status]}
            </p>
            <p className="text-sm text-muted-foreground">
              Order date {formatOrderDate(order.order_date)}
            </p>
          </div>
        </section>

        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="border-b border-border py-1.5 pr-2 font-medium">
                Item
              </th>
              <th className="w-12 border-b border-border py-1.5 pr-2 text-right font-medium">
                Qty
              </th>
              <th className="w-24 border-b border-border py-1.5 pr-2 text-right font-medium">
                Unit
              </th>
              <th className="w-28 border-b border-border py-1.5 text-right font-medium">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="border-b border-border py-2 text-sm text-muted-foreground"
                >
                  This order has no items.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="border-b border-border py-1.5 pr-2">
                    <span className="block">{item.product_name}</span>
                    {item.product_code ? (
                      <span className="block font-mono text-[11px] text-muted-foreground">
                        {item.product_code}
                      </span>
                    ) : null}
                  </td>
                  <td className="border-b border-border py-1.5 pr-2 text-right tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="border-b border-border py-1.5 pr-2 text-right tabular-nums">
                    {formatPeso(Number(item.unit_price_centavos || 0))}
                  </td>
                  <td className="border-b border-border py-1.5 text-right tabular-nums">
                    {formatPeso(Number(item.line_total_centavos || 0))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="ml-auto max-w-xs space-y-1">
          <Line
            label="Product total"
            value={formatPeso(Number(order.product_total_centavos || 0))}
          />
          <Line
            label="Shipping"
            value={formatPeso(Number(order.shipping_fee_centavos || 0))}
          />
          <Line
            label="Discount"
            value={`−${formatPeso(Number(order.discount_centavos || 0))}`}
          />
          <Line
            label="Final amount"
            value={formatPeso(Number(order.final_amount_centavos || 0))}
            strong
          />
        </div>

        {order.notes ? (
          <section className="border-t border-border pt-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Notes
            </h2>
            <p className="mt-1 whitespace-pre-line text-sm">{order.notes}</p>
          </section>
        ) : null}

        <p className="border-t border-border pt-3 text-xs text-muted-foreground">
          Thank you for shopping with Torisabi.
        </p>
      </article>
    </div>
  );
}
