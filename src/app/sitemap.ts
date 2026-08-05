import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/lib/queries";
import { absoluteUrl } from "@/lib/seo";

/**
 * Auto-generated from the products database (MASTER-PLAN.md §10 SEO).
 * Sold items stay in the sitemap on purpose — their pages keep earning long-tail
 * search traffic and carry `SoldOut` availability instead of 404ing.
 *
 * Dynamic because the product list is read per request; the sitemap must never be
 * baked in at build time when the catalog changes daily.
 */
export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];

const STATIC_ROUTES: {
  path: string;
  changeFrequency: Entry["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/how-to-order", changeFrequency: "monthly", priority: 0.7 },
  { path: "/shipping", changeFrequency: "monthly", priority: 0.6 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/policies", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let products: { slug: string; updated_at: string }[] = [];
  try {
    products = await getAllProductSlugs();
  } catch (error) {
    // Supabase unreachable or not configured yet: a sitemap listing only the
    // static pages is far better than a 500 that tells Google nothing.
    console.error("sitemap: could not load product slugs", error);
    return staticEntries;
  }

  return [
    ...staticEntries,
    ...products.map((product) => ({
      url: absoluteUrl(`/products/${product.slug}`),
      lastModified: new Date(product.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
