import { PRODUCT_STATUS_LABELS, type ProductStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<ProductStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  available: "bg-sage-soft text-sage",
  limited: "bg-brand-soft text-brand",
  reserved: "bg-secondary text-secondary-foreground",
  sold_out: "bg-foreground text-background",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProductStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
        STATUS_STYLES[status],
        className,
      )}
    >
      {PRODUCT_STATUS_LABELS[status]}
    </span>
  );
}

/**
 * Sold items stay in the gallery as social proof (MASTER-PLAN.md §3), so the
 * photo carries the SOLD mark rather than the item being hidden.
 */
export function SoldOverlay() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-background/45">
      <span className="rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-background">
        Sold
      </span>
    </div>
  );
}
