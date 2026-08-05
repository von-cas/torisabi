import { createClient } from "@/lib/supabase/server";
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
 * These run per request (no caching) so an admin edit — marking an item Sold Out,
 * say — is reflected on the site immediately. See MASTER-PLAN.md §10.
 */

export interface ProductFilters {
  category?: string;
  status?: string;
  sort?: "newest" | "price-asc" | "price-desc";
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

export async function getProducts(
  filters: ProductFilters = {},
): Promise<ProductWithPhotos[]> {
  const supabase = await createClient();

  let query = supabase.from("public_products").select("*");
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.status) query = query.eq("status", filters.status);

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

export async function getFeaturedProducts(
  limit = 6,
): Promise<ProductWithPhotos[]> {
  const all = await getProducts();
  const featured = all.filter((p) => p.featured && p.status !== "sold_out");
  return (featured.length ? featured : all).slice(0, limit);
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithPhotos | null> {
  const supabase = await createClient();

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

/** Distinct categories that currently have at least one visible product. */
export async function getCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_products")
    .select("category")
    .not("category", "is", null);

  return [...new Set((data ?? []).map((r) => r.category as string))].sort();
}

/** All slugs, for sitemap generation. */
export async function getAllProductSlugs(): Promise<
  { slug: string; updated_at: string }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_products")
    .select("slug, updated_at");
  return data ?? [];
}

export { SOLD_LAST };
