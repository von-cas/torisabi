import {
  getCategories,
  getFeaturedProducts,
  getProductBySlug,
  getProducts,
  type ProductFilters,
} from "@/lib/queries";
import type { ProductWithPhotos } from "@/lib/types";

/**
 * The public pages must render even when Supabase is unreachable or not yet
 * provisioned — a catalog that 500s is worse than a catalog that says "no
 * products yet". Every read goes through these wrappers, which degrade to an
 * empty result instead of throwing.
 */

async function safely<T>(label: string, run: () => Promise<T>, fallback: T) {
  try {
    return await run();
  } catch (error) {
    console.error(`[torisabi] ${label} failed:`, error);
    return fallback;
  }
}

export function safeGetProducts(
  filters: ProductFilters = {},
): Promise<ProductWithPhotos[]> {
  return safely("getProducts", () => getProducts(filters), []);
}

export function safeGetFeaturedProducts(
  limit?: number,
): Promise<ProductWithPhotos[]> {
  return safely("getFeaturedProducts", () => getFeaturedProducts(limit), []);
}

export function safeGetProductBySlug(
  slug: string,
): Promise<ProductWithPhotos | null> {
  return safely("getProductBySlug", () => getProductBySlug(slug), null);
}

export function safeGetCategories(): Promise<string[]> {
  return safely("getCategories", () => getCategories(), []);
}
