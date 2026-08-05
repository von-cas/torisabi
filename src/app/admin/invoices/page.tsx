import Link from "next/link";
import { formatOrderDate } from "@/components/admin/order-shared";
import { formatPeso } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  invoice_date: string;
  order_id: string;
}

interface OrderRow {
  id: string;
  customer_name: string;
  final_amount_centavos: number;
}

interface Listed extends InvoiceRow {
  customer_name: string;
  final_amount_centavos: number;
}

async function loadInvoices(): Promise<{
  invoices: Listed[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, invoice_date, order_id")
      .order("invoice_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) return { invoices: [], error: error.message };

    const rows = (data ?? []) as InvoiceRow[];
    if (rows.length === 0) return { invoices: [], error: null };

    // Amounts live on the order, never copied onto the invoice, so they are
    // read back through it here.
    const { data: orderRows } = await supabase
      .from("orders")
      .select("id, customer_name, final_amount_centavos")
      .in(
        "id",
        rows.map((row) => row.order_id),
      );

    const orders = new Map(
      ((orderRows ?? []) as OrderRow[]).map((order) => [order.id, order]),
    );

    return {
      invoices: rows.map((row) => {
        const order = orders.get(row.order_id);
        return {
          ...row,
          customer_name: order?.customer_name ?? "—",
          final_amount_centavos: Number(order?.final_amount_centavos ?? 0),
        };
      }),
      error: null,
    };
  } catch {
    return { invoices: [], error: "the database is not configured yet" };
  }
}

export default async function AdminInvoicesPage() {
  const { invoices, error } = await loadInvoices();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-base font-semibold tracking-tight">
          Invoices
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {invoices.length}
          </span>
        </h1>
        <Link
          href="/admin/orders"
          className="flex h-11 items-center rounded-md border border-border px-3 text-xs md:h-8"
        >
          Orders
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-border bg-muted/50 p-2.5 text-xs text-muted-foreground">
          Could not load invoices: {error}
        </p>
      ) : null}

      {invoices.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          No invoices yet. Open an order and press{" "}
          <span className="font-medium">Create invoice</span>.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <Link
                href={`/admin/invoices/${invoice.id}`}
                className="flex min-h-11 items-center justify-between gap-3 px-3 py-2 hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">
                    <span className="font-mono text-xs text-muted-foreground">
                      {invoice.invoice_number}
                    </span>{" "}
                    {invoice.customer_name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatOrderDate(invoice.invoice_date)}
                  </span>
                </span>
                <span className="shrink-0 text-sm tabular-nums">
                  {formatPeso(invoice.final_amount_centavos)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
