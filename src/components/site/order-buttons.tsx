"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { INSTAGRAM_DM_URL, InstagramIcon } from "@/components/site/instagram";
import { BUTTON, BUTTON_PRIMARY, SHADE } from "@/components/site/sticker";
import {
  PRODUCT_STATUS_LABELS,
  isOrderable,
  type ProductStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

/** The exact text a customer pastes into the DM (MASTER-PLAN.md §4). */
export function orderMessage(name: string, code: string): string {
  return `Hi Torisabi! I'm interested in ${name}, product code ${code}. Is this still available?`;
}

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
  const message = orderMessage(name, code);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is unavailable (older browser or insecure context).
      // The message is printed below the buttons so it can still be copied.
    }
  }

  // Sold and reserved items keep their page and their photos — only the order
  // action is replaced by a disabled state.
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
            ? "This one has found its home. There may be something similar on the shelf — or ask me and I will see what I can make."
            : "This one is on hold for someone else right now. Send a message and I will tell you if it comes free."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={copyMessage}
          style={SHADE.aqua}
          className={cn(BUTTON, "flex-1")}
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied ? "Copied!" : "Copy order message"}
        </button>

        <a
          href={INSTAGRAM_DM_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={SHADE.magenta}
          className={cn(BUTTON_PRIMARY, "flex-1")}
        >
          <InstagramIcon className="size-4" />
          Order on Instagram
        </a>
      </div>

      <p aria-live="polite" className="sr-only">
        {copied ? "Order message copied to clipboard" : ""}
      </p>

      {/* Shown as well as copied, so it still works where the clipboard does not. */}
      <p className="rounded-2xl border-2 border-dashed border-ink/25 bg-magenta-soft/50 px-4 py-3 text-sm leading-relaxed text-ink/80">
        {message}
      </p>
    </div>
  );
}
