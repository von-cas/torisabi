"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The hand-drawn logo, with a drawn-in-CSS understudy.
 *
 * `/logo.png` is not in the repo yet — the owner is still saving it — so a
 * missing file must never leave a broken image on a live shop. When the image
 * fails to load, the same wordmark is set letter-by-letter in the logo's own
 * colours instead. When the file lands, the real logo simply takes over.
 */

/** Letters alternate through the logo colours, skipping the two that are
 *  too pale to read on white. */
const LETTERS = [
  { char: "T", color: "var(--magenta)", tilt: "-3deg" },
  { char: "o", color: "var(--grape)", tilt: "2deg" },
  { char: "r", color: "var(--berry)", tilt: "-1deg" },
  { char: "i", color: "var(--leaf)", tilt: "3deg" },
  { char: "s", color: "var(--magenta)", tilt: "-2deg" },
  { char: "a", color: "var(--grape)", tilt: "1deg" },
  { char: "b", color: "var(--berry)", tilt: "-3deg" },
  { char: "i", color: "var(--leaf)", tilt: "2deg" },
];

export function Wordmark({
  width = 150,
  className,
  priority,
}: {
  /** Rendered width of the logo image, in pixels. */
  width?: number;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "inline-flex items-baseline font-hand font-extrabold leading-none tracking-tight",
          className,
        )}
        style={{ fontSize: width / 4.4 }}
      >
        <span className="sr-only">Torisabi</span>
        {LETTERS.map((letter, index) => (
          <span
            key={`${letter.char}-${index}`}
            aria-hidden="true"
            className="inline-block"
            style={{ color: letter.color, transform: `rotate(${letter.tilt})` }}
          >
            {letter.char}
          </span>
        ))}
      </span>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="Torisabi"
      width={width}
      height={Math.round(width * 0.4)}
      priority={priority}
      onError={() => setFailed(true)}
      className={cn("h-auto", className)}
      style={{ width, height: "auto" }}
    />
  );
}
