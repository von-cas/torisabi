"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { formatPeso } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
  type PaymentState,
} from "@/lib/types";
import { PaymentBadge, formatOrderDate } from "./order-shared";

/**
 * Dense order list (MASTER-PLAN.md §5): a tight table on desktop, two-line cards
 * on phones. Status is an inline dropdown that saves the moment it changes, the
 * same as the product list — moving an order along the pipeline is one tap.
 *
 * Rows arrive newest first from the server; the only control here is the status
 * filter.
 */

export interface AdminOrderRow {
  id: string;
  order_number: string;
  order_date: string;
  customer_name: string;
  final_amount_centavos: number;
  status: OrderStatus;
  payment_state: PaymentState;
}

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

const SELECT =
  "h-11 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-ring md:h-8";

export function OrderTable({
  orders,
  loadError,
}: {
  orders: AdminOrderRow[];
  loadError: string | null;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [pending, setPending] = useState<Record<string, OrderStatus>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const statusOf = (row: AdminOrderRow) => pending[row.id] ?? row.status;
  const visible = orders.filter((row) =>
    filter === "all" ? true : statusOf(row) === filter,
  );

  async function changeStatus(row: AdminOrderRow, status: OrderStatus) {
    setSavingId(row.id);
    setSaveError(null);
    setPending((current) => ({ ...current, [row.id]: status }));
    try {
      const { error } = await createClient()
        .from("orders")
        .update({ status })
        .eq("id", row.id);
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (caught) {
      setPending((current) => {
        const next = { ...current };
        delete next[row.id];
        return next;
      });
      setSaveError(
        caught instanceof Error ? caught.message : "Could not save that status.",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-base font-semibold tracking-tight">
          Orders
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {orders.length}
          </span>
        </h1>

        <label className="sr-only" htmlFor="status-filter">
          Filter by status
        </label>
        <select
          id="status-filter"
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value as "all" | OrderStatus)
          }
          className={SELECT}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <Link
          href="/admin/invoices"
          className="flex h-11 items-center rounded-md border border-border px-3 text-xs md:h-8"
        >
          Invoices
        </Link>

        <Link
          href="/admin/orders/new"
          className="hidden h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground md:inline-flex"
        >
          + New order
        </Link>
      </div>

      {loadError ? (
        <p className="rounded-lg border border-border bg-muted/50 p-2.5 text-xs text-muted-foreground">
          Could not load orders: {loadError}
        </p>
      ) : null}
      {saveError ? (
        <p className="rounded-lg border border-destructive/40 p-2.5 text-xs text-destructive">
          {saveError}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          {orders.length === 0 ? (
            <>
              No orders yet.{" "}
              <Link href="/admin/orders/new" className="underline">
                Record one
              </Link>
              .
            </>
          ) : (
            "No orders with that status."
          )}
        </p>
      ) : (
        <>
          <table className="hidden w-full border-separate border-spacing-0 text-sm md:table">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="sticky top-0 w-24 border-b border-border bg-background py-1.5 pr-2 font-medium">
                  Order
                </th>
                <th className="sticky top-0 w-28 border-b border-border bg-background py-1.5 pr-2 font-medium">
                  Date
                </th>
                <th className="sticky top-0 border-b border-border bg-background py-1.5 pr-2 font-medium">
                  Customer
                </th>
                <th className="sticky top-0 w-28 border-b border-border bg-background py-1.5 pr-2 text-right font-medium">
                  Amount
                </th>
                <th className="sticky top-0 w-24 border-b border-border bg-background py-1.5 pr-2 font-medium">
                  Payment
                </th>
                <th className="sticky top-0 w-48 border-b border-border bg-background py-1.5 pr-2 font-medium">
                  Status
                </th>
                <th className="sticky top-0 w-16 border-b border-border bg-background py-1.5 font-medium">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="hover:bg-muted/50">
                  <td className="border-b border-border py-1 pr-2 font-mono text-xs text-muted-foreground">
                    {row.order_number}
                  </td>
                  <td className="border-b border-border py-1 pr-2 text-xs tabular-nums text-muted-foreground">
                    {formatOrderDate(row.order_date)}
                  </td>
                  <td className="max-w-0 border-b border-border py-1 pr-2">
                    <div className="truncate">{row.customer_name}</div>
                  </td>
                  <td className="border-b border-border py-1 pr-2 text-right tabular-nums">
                    {formatPeso(Number(row.final_amount_centavos || 0))}
                  </td>
                  <td className="border-b border-border py-1 pr-2">
                    <PaymentBadge state={row.payment_state} />
                  </td>
                  <td className="border-b border-border py-1 pr-2">
                    <select
                      aria-label={`Status of ${row.order_number}`}
                      value={statusOf(row)}
                      disabled={savingId === row.id}
                      onChange={(event) =>
                        changeStatus(row, event.target.value as OrderStatus)
                      }
                      className={SELECT}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {ORDER_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border-b border-border py-1">
                    <Link
                      href={`/admin/orders/${row.id}`}
                      className="text-xs underline underline-offset-2"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="space-y-2 md:hidden">
            {visible.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-border bg-card p-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <Link
                    href={`/admin/orders/${row.id}`}
                    className="min-h-11 min-w-0 flex-1 truncate py-2.5 text-sm font-medium"
                  >
                    {row.customer_name}
                  </Link>
                  <span className="shrink-0 text-sm tabular-nums">
                    {formatPeso(Number(row.final_amount_centavos || 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-[11px] text-muted-foreground">
                    <span className="font-mono">{row.order_number}</span> ·{" "}
                    {formatOrderDate(row.order_date)}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <PaymentBadge state={row.payment_state} />
                    <select
                      aria-label={`Status of ${row.order_number}`}
                      value={statusOf(row)}
                      disabled={savingId === row.id}
                      onChange={(event) =>
                        changeStatus(row, event.target.value as OrderStatus)
                      }
                      className={SELECT}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {ORDER_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Link
        href="/admin/orders/new"
        aria-label="New order"
        className="fixed bottom-20 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  );
}
