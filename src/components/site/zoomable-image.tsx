"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, X } from "lucide-react";

import { photoUrl } from "@/components/site/product-image";
import { cn } from "@/lib/utils";

/**
 * The main product photo, zoomable on every device:
 *  - a mouse hovers to magnify, the zoom following the cursor;
 *  - a finger taps to open a full-screen viewer with pinch-to-zoom and drag.
 * The inline image keeps next/image (responsive + priority) so it stays the fast
 * LCP element; only the on-demand viewer uses a plain <img> it can transform
 * freely.
 */
export function ZoomableImage({
  path,
  alt,
  sizes,
  className,
}: {
  path: string | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const src = photoUrl(path);
  const [origin, setOrigin] = useState("50% 50%");
  const [hovering, setHovering] = useState(false);
  const [open, setOpen] = useState(false);

  if (!src) {
    return (
      <div
        className={cn(
          "relative grid place-items-center overflow-hidden bg-muted text-muted-foreground/60",
          className,
        )}
      >
        <ImageIcon className="size-8" aria-hidden="true" />
        <span className="sr-only">Photo coming soon</span>
      </div>
    );
  }

  const canHover = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function trackCursor(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="Zoom photo"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        onMouseEnter={() => canHover() && setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={(e) => hovering && trackCursor(e)}
        className={cn(
          "relative cursor-zoom-in overflow-hidden select-none",
          className,
        )}
      >
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{
            transform: hovering ? "scale(2.2)" : "scale(1)",
            transformOrigin: origin,
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority
            className="object-contain"
            draggable={false}
          />
        </div>
      </div>

      {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}

type Transform = { scale: number; x: number; y: number };
const RESET: Transform = { scale: 1, x: 0, y: 0 };
const MIN = 1;
const MAX = 4;
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n));

function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [t, setT] = useState<Transform>(RESET);
  const [interacting, setInteracting] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; midX: number; midY: number } | null>(
    null,
  );
  const lastTap = useRef(0);
  const moved = useRef(false);

  // Lock the page behind the viewer and close on Escape.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function centre() {
    const ps = [...pointers.current.values()];
    const [a, b] = ps;
    return {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2,
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    setInteracting(true);
    if (pointers.current.size === 2) pinch.current = centre();
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const now = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, now);

    if (pointers.current.size >= 2 && pinch.current) {
      const next = centre();
      const ratio = next.dist / pinch.current.dist;
      setT((cur) => ({
        scale: clamp(cur.scale * ratio),
        x: cur.x + (next.midX - pinch.current!.midX),
        y: cur.y + (next.midY - pinch.current!.midY),
      }));
      pinch.current = next;
      moved.current = true;
      return;
    }

    // One finger / mouse drag pans, but only once zoomed in.
    setT((cur) => {
      if (cur.scale <= 1) return cur;
      return { ...cur, x: cur.x + (now.x - prev.x), y: cur.y + (now.y - prev.y) };
    });
    if (Math.abs(now.x - prev.x) + Math.abs(now.y - prev.y) > 2)
      moved.current = true;
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setInteracting(false);

    // A quick tap that did not drag: double-tap toggles zoom, single closes.
    if (!moved.current && pointers.current.size === 0) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        setT((cur) => (cur.scale > 1 ? RESET : { scale: 2.5, x: 0, y: 0 }));
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }
  }

  function onWheel(e: React.WheelEvent) {
    setT((cur) => ({ ...cur, scale: clamp(cur.scale - e.deltaY * 0.002) }));
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 backdrop-blur-sm"
      // A tap on the dark backdrop (that was not a drag) closes the viewer.
      onClick={() => {
        if (!moved.current) onClose();
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-paper/90 text-ink"
      >
        <X className="size-5" />
      </button>

      <div
        className="h-full w-full touch-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="mx-auto h-full w-full object-contain will-change-transform"
          style={{
            transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
            transition: interacting ? "none" : "transform 150ms ease-out",
            cursor: t.scale > 1 ? "grab" : "zoom-in",
          }}
        />
      </div>

      <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-paper/85 px-3 py-1 text-xs font-medium text-ink">
        Pinch or scroll to zoom · double-tap to reset
      </p>
    </div>
  );
}
