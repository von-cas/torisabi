import { PRODUCT_STATUS_LABELS, type ProductStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Availability reads as a hand-cut paper tag: white, ink outline, and one
 * coloured dot. Keeping the label in ink means every status is legible, and
 * the colour still does the fast visual sorting.
 */
const DOTS: Record<ProductStatus, string> = {
  draft: "bg-ink/25",
  available: "bg-leaf",
  limited: "bg-berry",
  reserved: "bg-grape",
  sold_out: "bg-ink",
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
        "inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-ink",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 rounded-full", DOTS[status])}
      />
      {PRODUCT_STATUS_LABELS[status]}
    </span>
  );
}

/**
 * Sold items stay in the gallery as social proof (MASTER-PLAN.md §3), so the
 * photo gets marked rather than the item being hidden — a rubber stamp
 * pressed across the picture, not a grey pill in the corner.
 */
export function SoldStamp() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-paper/55">
      <span className="-rotate-12 rounded-2xl border-[3px] border-berry pt-1 pr-3 pb-1.5 pl-4 font-hand text-2xl leading-none font-extrabold tracking-[0.18em] text-berry uppercase outline-2 outline-offset-[3px] outline-berry sm:text-3xl">
        Sold
      </span>
    </div>
  );
}
