import type { PaymentState } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Small pieces shared by the order screens and the invoice view.
 * `src/lib/types.ts` carries the order-status labels; the payment ones live here
 * next to the only screens that use them.
 */

export const PAYMENT_STATE_LABELS: Record<PaymentState, string> = {
  unpaid: "Unpaid",
  partial: "Part paid",
  paid: "Paid",
  refunded: "Refunded",
};

export const PAYMENT_STATES = Object.keys(
  PAYMENT_STATE_LABELS,
) as PaymentState[];

/** MASTER-PLAN.md §5. Stored as free text so an unusual method still fits. */
export const PAYMENT_METHODS = ["GCash", "Bank transfer", "COD", "Other"];

const PAYMENT_STYLES: Record<PaymentState, string> = {
  unpaid: "bg-muted text-muted-foreground",
  partial: "bg-brand-soft text-brand",
  paid: "bg-sage-soft text-sage",
  refunded: "bg-secondary text-secondary-foreground",
};

export function PaymentBadge({
  state,
  className,
}: {
  state: PaymentState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        PAYMENT_STYLES[state],
        className,
      )}
    >
      {PAYMENT_STATE_LABELS[state]}
    </span>
  );
}

/**
 * "2026-08-05" → "5 Aug 2026". Formatted in UTC because `order_date` is a plain
 * calendar date — reading it in a local zone would shift it by a day.
 */
export function formatOrderDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

/** Today in Manila as YYYY-MM-DD, for prefilling a date input. */
export function manilaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
