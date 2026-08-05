import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/site/content";
import { JsonLd } from "@/components/site/json-ld";
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
import { breadcrumbJsonLd } from "@/lib/seo";
import { PUBLIC_STATUSES, type ProductStatus } from "@/lib/types";

type SortValue = NonNullable<QueryFilters["sort"]>;

const SORTS = ["newest", "price-asc", "price-desc"] as const;

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

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

/** The filters actually applied — anything the query cannot use is dropped. */
function readFilters(params: Record<string, string | string[] | undefined>) {
  return {
    category: firstValue(params.category) || undefined,
    status: toStatus(firstValue(params.status)),
    sort: toSort(firstValue(params.sort)),
  };
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const { category, status, sort } = readFilters(await searchParams);
  const isFiltered = Boolean(category || status || sort);

  return {
    title: "Products",
    description:
      "Browse the full Torisabi collection — photos, prices, and availability. Order any piece through Instagram.",
    // One indexable gallery. Filter and sort permutations show the same items in
    // a different order, so they stay out of the index and pass their link
    // equity on to the clean /products URL (MASTER-PLAN.md §10 SEO).
    alternates: { canonical: "/products" },
    ...(isFiltered && { robots: { index: false, follow: true } }),
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const { category, status, sort } = readFilters(await searchParams);

  const [products, categories] = await Promise.all([
    safeGetProducts({ category, status, sort }),
    safeGetCategories(),
  ]);

  const query: GalleryQuery = { category, status, sort };
  const isFiltered = Boolean(category || status || sort);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
        ])}
      />

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
