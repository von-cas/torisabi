import { unstable_cache } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";
import type {
  ProductPhoto,
  ProductWithPhotos,
  PublicProduct,
} from "@/lib/types";

/**
 * Public data access. Everything here reads the `public_products` /
 * `public_product_photos` views, so drafts, archived items, and cost prices are
 * unreachable by construction rather than by a filter someone might forget.
 *
 * The reads go through a cookie-free client and are wrapped in `unstable_cache`,
 * so a busy day serves the catalogue from cache instead of re-querying Supabase
 * (and re-rendering) for every visitor. All entries share the `CATALOGUE_TAG`,
 * which `/api/revalidate` purges the instant an admin adds, edits, sells, or
 * removes a product — so an edit still shows immediately. The one-hour
 * `revalidate` is only a backstop for a missed purge. See MASTER-PLAN.md §10.
 */

/** On-demand cache tag for every public catalogue read. */
export const CATALOGUE_TAG = "catalogue";

/** Backstop TTL (seconds): cached catalogue data self-heals within the hour even
 *  if an on-demand purge is ever missed. */
const CACHE_TTL = 3600;

export interface ProductFilters {
  category?: string;
  status?: string;
  sort?: "newest" | "price-asc" | "price-desc";
  /** Free-text keyword search over name, description and category. */
  q?: string;
}

/**
 * Turn a raw search box value into safe keyword tokens. Anything that isn't a
 * letter, number or space is dropped, because those characters (commas,
 * parentheses, `%`, `*`) are operators inside a PostgREST `.or()` filter and
 * would otherwise break the query or let a visitor shape it.
 */
function keywords(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6); // a handful of words is plenty; ignore the rest
}

function attachPhotos(
  products: PublicProduct[],
  photos: ProductPhoto[],
): ProductWithPhotos[] {
  const byProduct = new Map<string, ProductPhoto[]>();
  for (const photo of photos) {
    const list = byProduct.get(photo.product_id) ?? [];
    list.push(photo);
    byProduct.set(photo.product_id, list);
  }
  return products.map((product) => ({
    ...product,
    photos: (byProduct.get(product.id) ?? []).sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
  }));
}

/** Sold-out items sort last so the gallery leads with what is buyable. */
const SOLD_LAST = "status.eq.sold_out";

async function getProductsUncached(
  filters: ProductFilters = {},
): Promise<ProductWithPhotos[]> {
  const supabase = createPublicClient();

  let query = supabase.from("public_products").select("*");
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.status) query = query.eq("status", filters.status);

  // Keyword search: a product must contain EVERY typed word somewhere in its
  // name, description or category. Each word becomes its own OR group, and
  // chaining .or() calls ANDs them — so "rattan bag" matches an item whose name
  // has "rattan" and whose description has "bag", not only the exact phrase.
  if (filters.q) {
    for (const word of keywords(filters.q)) {
      query = query.or(
        `name.ilike.%${word}%,description.ilike.%${word}%,category.ilike.%${word}%`,
      );
    }
  }

  // Available items first, then the chosen sort.
  query = query.order("status", { ascending: true });
  if (filters.sort === "price-asc") {
    query = query.order("price_centavos", { ascending: true });
  } else if (filters.sort === "price-desc") {
    query = query.order("price_centavos", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: products, error } = await query;
  if (error) throw error;
  if (!products?.length) return [];

  const { data: photos } = await supabase
    .from("public_product_photos")
    .select("*")
    .in(
      "product_id",
      products.map((p) => p.id),
    );

  const withPhotos = attachPhotos(products, photos ?? []);
  return withPhotos.sort(
    (a, b) => Number(a.status === "sold_out") - Number(b.status === "sold_out"),
  );
}

export const getProducts = unstable_cache(getProductsUncached, ["products"], {
  tags: [CATALOGUE_TAG],
  revalidate: CACHE_TTL,
});

export async function getFeaturedProducts(
  limit = 6,
): Promise<ProductWithPhotos[]> {
  const all = await getProducts();
  const featured = all.filter((p) => p.featured && p.status !== "sold_out");
  return (featured.length ? featured : all).slice(0, limit);
}

async function getProductBySlugUncached(
  slug: string,
): Promise<ProductWithPhotos | null> {
  const supabase = createPublicClient();

  const { data: product } = await supabase
    .from("public_products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!product) return null;

  const { data: photos } = await supabase
    .from("public_product_photos")
    .select("*")
    .eq("product_id", product.id);

  return attachPhotos([product], photos ?? [])[0];
}

export const getProductBySlug = unstable_cache(
  getProductBySlugUncached,
  ["product-by-slug"],
  { tags: [CATALOGUE_TAG], revalidate: CACHE_TTL },
);

/** Distinct categories that currently have at least one visible product. */
async function getCategoriesUncached(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("public_products")
    .select("category")
    .not("category", "is", null);

  return [...new Set((data ?? []).map((r) => r.category as string))].sort();
}

export const getCategories = unstable_cache(
  getCategoriesUncached,
  ["categories"],
  { tags: [CATALOGUE_TAG], revalidate: CACHE_TTL },
);

/** All slugs, for sitemap generation. */
async function getAllProductSlugsUncached(): Promise<
  { slug: string; updated_at: string }[]
> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("public_products")
    .select("slug, updated_at");
  return data ?? [];
}

export const getAllProductSlugs = unstable_cache(
  getAllProductSlugsUncached,
  ["product-slugs"],
  { tags: [CATALOGUE_TAG], revalidate: CACHE_TTL },
);

export { SOLD_LAST };
