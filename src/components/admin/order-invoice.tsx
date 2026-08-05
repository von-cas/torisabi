"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatOrderDate } from "./order-shared";

/**
 * The one-click invoice (MASTER-PLAN.md §5). An invoice row only points at its
 * order — the amounts are read through it — so creating one is a single insert
 * with nothing re-typed. `invoice_number` comes from the database sequence and
 * is never sent from here.
 *
 * When the order already has an invoice, that invoice is shown instead of a
 * second "create" button.
 */

export interface OrderInvoiceRow {
  id: string;
  invoice_number: string;
  invoice_date: string;
}

export function OrderInvoice({
  orderId,
  invoice,
}: {
  orderId: string;
  invoice: OrderInvoiceRow | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const { data, error: insertError } = await createClient()
        .from("invoices")
        .insert({ order_id: orderId })
        .select("id")
        .single();
      if (insertError) throw new Error(insertError.message);
      router.push(`/admin/invoices/${(data as { id: string }).id}`);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not create the invoice.",
      );
      setBusy(false);
    }
  }

  return (
    <section className="max-w-3xl space-y-2 rounded-lg border border-border bg-card p-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Invoice
      </h2>

      {invoice ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">
            <span className="font-mono">{invoice.invoice_number}</span>
            <span className="text-muted-foreground">
              {" "}
              · {formatOrderDate(invoice.invoice_date)}
            </span>
          </span>
          <Link
            href={`/admin/invoices/${invoice.id}`}
            className="ml-auto flex h-11 items-center rounded-md border border-border px-3 text-sm md:h-9"
          >
            Open invoice
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-xs text-muted-foreground">
            Nothing to re-type — the invoice reads this order&apos;s amounts.
          </p>
          <button
            type="button"
            onClick={create}
            disabled={busy}
            className="flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50 md:h-9"
          >
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Create invoice
          </button>
        </div>
      )}

      {error ? (
        <p className="rounded-md border border-destructive/40 p-2.5 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
