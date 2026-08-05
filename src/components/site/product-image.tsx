import Image from "next/image";
import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

/** Public CDN URL for a photo stored in the `product-photos` bucket. */
export function photoUrl(path: string | null | undefined): string | null {
  if (!path || !SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/product-photos/${path}`;
}

export function ProductImage({
  path,
  alt,
  sizes,
  className,
  imageClassName,
  priority,
}: {
  path: string | null | undefined;
  alt: string;
  /** Required so the CDN serves a rendition that fits the slot. */
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  const src = photoUrl(path);

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground/60">
          <ImageIcon className="size-8" aria-hidden="true" />
          <span className="sr-only">Photo coming soon</span>
        </div>
      )}
    </div>
  );
}
