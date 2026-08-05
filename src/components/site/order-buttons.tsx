"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { INSTAGRAM_DM_URL, InstagramIcon } from "@/components/site/instagram";
import { Button, buttonVariants } from "@/components/ui/button";
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

const ACTION_CLASSES = "h-12 flex-1 px-5 text-sm sm:text-base";

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
        <Button
          type="button"
          disabled
          className={cn(ACTION_CLASSES, "w-full")}
          aria-label={`This item is ${PRODUCT_STATUS_LABELS[status].toLowerCase()}`}
        >
          {PRODUCT_STATUS_LABELS[status]}
        </Button>
        <p className="text-sm text-muted-foreground">
          {status === "sold_out"
            ? "This piece has found its home. Browse the gallery for what is still available."
            : "This piece is on hold for another customer right now."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={copyMessage}
          className={ACTION_CLASSES}
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied ? "Copied!" : "Copy Order Message"}
        </Button>

        <a
          href={INSTAGRAM_DM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "default" }),
            ACTION_CLASSES,
            "bg-brand text-brand-foreground hover:bg-brand/90",
          )}
        >
          <InstagramIcon className="size-4" />
          Order on Instagram
        </a>
      </div>

      <p aria-live="polite" className="sr-only">
        {copied ? "Order message copied to clipboard" : ""}
      </p>

      <p className="rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
