"use client";

import { useState } from "react";

import { ProductImage } from "@/components/site/product-image";
import { SHADE } from "@/components/site/sticker";
import { SoldStamp } from "@/components/site/status-badge";
import type { ProductPhoto } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductPhotos({
  photos,
  name,
  sold,
}: {
  photos: ProductPhoto[];
  name: string;
  sold: boolean;
}) {
  const [active, setActive] = useState(0);
  const current = photos[active];

  return (
    <div className="space-y-4">
      <div style={SHADE.magenta} className="sticker relative rounded-3xl">
        <ProductImage
          path={current?.display_path}
          alt={current?.alt_text ?? name}
          sizes="(min-width: 1024px) 34rem, 100vw"
          priority
          className="aspect-square w-full rounded-[1.375rem] bg-paper"
          imageClassName="object-contain"
        />
        {sold && <SoldStamp />}
      </div>

      {photos.length > 1 && (
        <ul className="flex flex-wrap gap-3">
          {photos.map((photo, index) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show photo ${index + 1} of ${photos.length}`}
                aria-current={index === active ? "true" : undefined}
                className={cn(
                  "block overflow-hidden rounded-xl border-2 border-ink transition-shadow",
                  index === active
                    ? "shadow-[3px_3px_0_0_var(--magenta)]"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                <ProductImage
                  path={photo.thumb_path}
                  alt=""
                  sizes="80px"
                  className="size-16 sm:size-20"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
