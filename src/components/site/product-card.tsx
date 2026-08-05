import Link from "next/link";

import { ProductImage } from "@/components/site/product-image";
import { SoldOverlay, StatusBadge } from "@/components/site/status-badge";
import { formatPeso } from "@/lib/money";
import type { ProductWithPhotos } from "@/lib/types";

export function ProductCard({ product }: { product: ProductWithPhotos }) {
  const photo = product.photos[0];
  const isSold = product.status === "sold_out";
  const hasDiscount = product.discounted_price_centavos !== null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-brand/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="relative">
        <ProductImage
          path={photo?.thumb_path ?? photo?.display_path}
          alt={photo?.alt_text ?? product.name}
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 33vw, 50vw"
          className="aspect-square w-full"
          imageClassName="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {isSold && <SoldOverlay />}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-snug text-foreground sm:text-base">
            {product.name}
          </h3>
          {!isSold && <StatusBadge status={product.status} />}
        </div>

        <p className="text-base font-semibold text-foreground sm:text-lg">
          {formatPeso(product.discounted_price_centavos ?? product.price_centavos)}
          {hasDiscount && (
            <span className="ml-2 text-sm font-normal text-muted-foreground line-through">
              {formatPeso(product.price_centavos)}
            </span>
          )}
        </p>

        {product.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        <span className="mt-auto pt-2 text-sm font-medium text-brand group-hover:underline">
          View Product
        </span>
      </div>
    </Link>
  );
}
