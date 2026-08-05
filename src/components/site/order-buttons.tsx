import { MESSENGER_URL, MessengerIcon } from "@/components/site/messenger";
import { BUTTON_PRIMARY, SHADE } from "@/components/site/sticker";
import {
  PRODUCT_STATUS_LABELS,
  isOrderable,
  type ProductStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The one ordering action: a single button that opens the Torisabi Messenger
 * chat. Sold and reserved items keep their page and photos but the button is
 * replaced by a disabled state. No client JavaScript — it is just a link.
 */
export function OrderButtons({
  status,
}: {
  status: ProductStatus;
}) {
  if (!isOrderable(status)) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          disabled
          aria-label={`This item is ${PRODUCT_STATUS_LABELS[status].toLowerCase()}`}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border-2 border-ink/25 bg-ink/5 px-6 font-hand text-xl font-extrabold tracking-[0.14em] text-ink/45 uppercase"
        >
          {PRODUCT_STATUS_LABELS[status]}
        </button>
        <p className="leading-relaxed text-ink/70">
          {status === "sold_out"
            ? "This one has found its home. There may be something similar on the shelf — or send a message and I will see what I can make."
            : "This one is on hold for someone else right now. Send a message and I will tell you if it comes free."}
        </p>
      </div>
    );
  }

  return (
    <a
      href={MESSENGER_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={SHADE.magenta}
      className={cn(BUTTON_PRIMARY, "w-full")}
    >
      <MessengerIcon className="size-5" />
      Message to order
    </a>
  );
}
