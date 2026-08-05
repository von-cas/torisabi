"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { MESSENGER_URL, MessengerIcon } from "@/components/site/messenger";
import { BUTTON_PRIMARY, SHADE } from "@/components/site/sticker";
import {
  PRODUCT_STATUS_LABELS,
  isOrderable,
  type ProductStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

/** The note copied to the clipboard so the customer can paste it in the chat. */
function orderNote(name: string, code: string): string {
  return `Hi Torisabi! I'm interested in ${name} (${code}). Is this still available?`;
}

/**
 * One ordering action. Tapping it copies a ready-made order note to the
 * clipboard and opens the Torisabi Messenger chat, so the customer only has to
 * paste — Messenger cannot pre-fill the composer from a link, and this is the
 * closest thing to it. Sold and reserved items show a disabled state instead.
 */
export function OrderButtons({
  name,
  code,
  status,
}: {
  name: string;
  code: string;
  status: ProductStatus;
}) {
  const [copied, setCopied] = useState(false);

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

  // Copy runs inside the click gesture, then the anchor opens Messenger in a new
  // tab on its own. If the clipboard is blocked (older browser), the chat still
  // opens — the customer just types instead of pasting.
  function copyNote() {
    navigator.clipboard
      ?.writeText(orderNote(name, code))
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 5000);
      })
      .catch(() => {});
  }

  return (
    <div className="space-y-2">
      <a
        href={MESSENGER_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={copyNote}
        style={SHADE.magenta}
        className={cn(BUTTON_PRIMARY, "w-full")}
      >
        <MessengerIcon className="size-5" />
        Message to order
      </a>

      {/* Nothing in the resting state; a brief confirmation only after a tap. */}
      <p aria-live="polite" className="min-h-5 text-sm font-medium text-magenta-ink">
        {copied ? (
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-4" aria-hidden="true" />
            Order note copied — just paste it in the chat.
          </span>
        ) : null}
      </p>
    </div>
  );
}
