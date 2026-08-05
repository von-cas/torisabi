import type { CSSProperties } from "react";

/**
 * The sticker language, in one place.
 *
 * Everything the visitor can act on — a card, a tag, a button — is a die-cut
 * sticker: white, chunky ink outline, a solid colour block offset behind it.
 * The `.sticker` classes live in globals.css; these are the four shadow
 * colours and the button shapes that use them.
 */

const SHADES = [
  "var(--magenta)",
  "var(--aqua)",
  "var(--grape)",
  "var(--lemon)",
] as const;

export const SHADE = {
  magenta: { "--shade": SHADES[0] } as CSSProperties,
  aqua: { "--shade": SHADES[1] } as CSSProperties,
  grape: { "--shade": SHADES[2] } as CSSProperties,
  lemon: { "--shade": SHADES[3] } as CSSProperties,
};

/**
 * Picks a shadow colour from a stable seed (a product code, a heading), so a
 * grid of cards is varied but never reshuffles between renders.
 */
export function shadeFor(seed: string): CSSProperties {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return { "--shade": SHADES[hash % SHADES.length] } as CSSProperties;
}

/** 48 px tall, so every action clears the 44 px touch target. */
export const BUTTON =
  "sticker sticker-lift inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold";

export const BUTTON_PRIMARY = `${BUTTON} bg-ink text-paper`;
