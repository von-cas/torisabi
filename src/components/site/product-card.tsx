import Link from "next/link";

import { ProductImage } from "@/components/site/product-image";
import { shadeFor } from "@/components/site/sticker";
import { SoldStamp, StatusBadge } from "@/components/site/status-badge";
import { formatPeso } from "@/lib/money";
import type { ProductWithPhotos } from "@/lib/types";

export function ProductCard({ product }: { product: ProductWithPhotos }) {
  const photo = product.photos[0];
  const isSold = product.status === "sold_out";
  const hasDiscount = product.discounted_price_centavos !== null;

  return (
    <Link
      href={`/products/${product.slug}`}
      style={shadeFor(product.code)}
      className="sticker sticker-lift group flex flex-col overflow-hidden rounded-3xl"
    >
      <div className="relative border-b-2 border-ink">
        <ProductImage
          path={photo?.thumb_path ?? photo?.display_path}
          alt={photo?.alt_text ?? product.name}
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 33vw, 50vw"
          className="aspect-square w-full"
          imageClassName="transition-transform duration-300 group-hover:scale-[1.04]"
        />
        {isSold && <SoldStamp />}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-hand text-lg leading-tight font-bold break-words text-ink sm:text-xl">
          {product.name}
        </h3>

        <p className="flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-semibold text-ink">
            {formatPeso(
              product.discounted_price_centavos ?? product.price_centavos,
            )}
          </span>
          {hasDiscount && (
            <span className="text-sm text-ink/50 line-through">
              {formatPeso(product.price_centavos)}
            </span>
          )}
        </p>

        {product.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink/70">
            {product.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          {!isSold ? (
            <StatusBadge status={product.status} />
          ) : (
            <span className="text-xs font-semibold tracking-wide text-ink/50 uppercase">
              Found its home
            </span>
          )}
          <span className="text-sm font-semibold text-magenta-ink group-hover:underline">
            Have a look
          </span>
        </div>
      </div>
    </Link>
  );
}
