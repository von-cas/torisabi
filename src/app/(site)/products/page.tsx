import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/site/content";
import { ProductCard } from "@/components/site/product-card";
import {
  ProductFilters,
  type GalleryQuery,
} from "@/components/site/product-filters";
import {
  safeGetCategories,
  safeGetProducts,
} from "@/components/site/safe-queries";
import type { ProductFilters as QueryFilters } from "@/lib/queries";
import { PUBLIC_STATUSES, type ProductStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse the full Torisabi collection — photos, prices, and availability. Order any piece through Instagram.",
};

type SortValue = NonNullable<QueryFilters["sort"]>;

const SORTS = ["newest", "price-asc", "price-desc"] as const;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Only values the database actually understands reach the query. */
function toStatus(value: string | undefined): ProductStatus | undefined {
  return PUBLIC_STATUSES.find((status) => status === value);
}

function toSort(value: string | undefined): SortValue | undefined {
  return SORTS.find((sort) => sort === value);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = firstValue(params.category);
  const status = toStatus(firstValue(params.status));
  const sort = toSort(firstValue(params.sort));

  const [products, categories] = await Promise.all([
    safeGetProducts({ category, status, sort }),
    safeGetCategories(),
  ]);

  const query: GalleryQuery = { category, status, sort };
  const isFiltered = Boolean(category ?? status ?? sort);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <PageHeader
        title="Products"
        lead="Every piece in the collection, including the ones already sold. Prices are in Philippine pesos."
      />

      <div className="mt-8">
        <ProductFilters categories={categories} query={query} />
      </div>

      {products.length > 0 ? (
        <>
          <p className="mt-8 text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "item" : "items"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-base font-medium">
            {isFiltered ? "Nothing matches those filters" : "No products yet"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {isFiltered
              ? "Try widening your search — the collection is small and changes often."
              : "The first pieces are on their way. Check back soon, or follow along on Instagram."}
          </p>
          {isFiltered && (
            <Link
              href="/products"
              className="mt-5 inline-flex text-sm font-medium text-brand hover:underline"
            >
              Clear filters
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
