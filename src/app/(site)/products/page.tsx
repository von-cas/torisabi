import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/site/content";
import { Strawberry } from "@/components/site/doodles";
import { MESSENGER_URL, MessengerIcon } from "@/components/site/messenger";
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
import { SearchBox } from "@/components/site/search-box";
import { BUTTON, SHADE } from "@/components/site/sticker";
import type { ProductFilters as QueryFilters } from "@/lib/queries";
import { breadcrumbJsonLd } from "@/lib/seo";
import { PUBLIC_STATUSES, type ProductStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const q = firstValue(params.q)?.trim();
  return {
    category: firstValue(params.category) || undefined,
    status: toStatus(firstValue(params.status)),
    sort: toSort(firstValue(params.sort)),
    q: q ? q.slice(0, 80) : undefined,
  };
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const { category, status, sort, q } = readFilters(await searchParams);
  const isFiltered = Boolean(category || status || sort || q);

  return {
    title: "Products",
    description:
      "Everything on the Torisabi shelf — photos, prices and what is still available. Handmade in Zamboanga, ordered through Facebook.",
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
  const { category, status, sort, q } = readFilters(await searchParams);

  const [products, categories] = await Promise.all([
    safeGetProducts({ category, status, sort, q }),
    safeGetCategories(),
  ]);

  const query: GalleryQuery = { category, status, sort, q };
  const isFiltered = Boolean(category || status || sort || q);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
        ])}
      />

      <PageHeader
        title="The shelf"
        lead="Everything I have made, including the pieces that already went home with someone. Prices are in Philippine pesos."
      />

      {/* An empty shelf has nothing to filter, so the controls stay out of the
          way — unless a filter is what emptied it. */}
      {(products.length > 0 || isFiltered) && (
        <div className="mt-10 space-y-6">
          <SearchBox query={query} />
          <ProductFilters categories={categories} query={query} />
        </div>
      )}

      {products.length > 0 ? (
        <>
          <p className="mt-10 text-sm font-semibold text-ink/60">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div
          style={SHADE.lemon}
          className="sticker mt-10 -rotate-1 rounded-3xl px-6 py-16 text-center"
        >
          <Strawberry className="mx-auto size-10" />
          <p className="mt-4 font-hand text-2xl font-extrabold text-ink sm:text-3xl">
            {q
              ? `Nothing matches “${q}”`
              : isFiltered
                ? "Nothing here with those filters"
                : "The shelf is empty — for now"}
          </p>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-ink/75">
            {isFiltered
              ? "The shelf is small and it changes often. Try another word, or clear the search."
              : "I am making the first batch. Everything goes up here the moment it is finished, and it lands on Facebook first."}
          </p>
          {isFiltered ? (
            <Link
              href="/products"
              style={SHADE.magenta}
              className={cn(BUTTON, "mt-6")}
            >
              Show everything
            </Link>
          ) : (
            <a
              href={MESSENGER_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={SHADE.magenta}
              className={cn(BUTTON, "mt-6")}
            >
              <MessengerIcon className="size-4" />
              Follow along on Facebook
            </a>
          )}
        </div>
      )}
    </div>
  );
}
