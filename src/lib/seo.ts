import { centavosToInput } from "@/lib/money";
import {
  FACEBOOK_PROFILE_URL,
  INSTAGRAM_URL,
  TIKTOK_URL,
} from "@/lib/social";
import type { ProductStatus, ProductWithPhotos } from "@/lib/types";

/**
 * Structured data helpers (MASTER-PLAN.md §10 SEO).
 *
 * Every export returns plain JSON-serialisable data — no JSX — so a page can drop
 * the result straight into:
 *   <script type="application/ld+json"
 *           dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(p)) }} />
 */

/** Canonical host. Apex torisabi.com 301s here, so every absolute URL uses www. */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.torisabi.com"
).replace(/\/+$/, "");

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
  /\/+$/,
  "",
);

/** Public bucket created in supabase/migrations/0001_init.sql. */
const PHOTO_BUCKET = "product-photos";

/** Site logo, served from `public/`. Google requires a real raster image here. */
const LOGO_PATH = "/logo.png";

/**
 * Product status → schema.org availability. `draft` never reaches a public page
 * (the `public_products` view filters it out) but the map stays total so a new
 * status can't silently fall through to `undefined`.
 */
const AVAILABILITY: Record<ProductStatus, string> = {
  draft: "https://schema.org/OutOfStock",
  available: "https://schema.org/InStock",
  limited: "https://schema.org/LimitedAvailability",
  reserved: "https://schema.org/PreOrder",
  sold_out: "https://schema.org/SoldOut",
};

/** "/products/ts-001-rattan-bag" → "https://www.torisabi.com/products/ts-001-rattan-bag". */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** A bucket-relative storage path → its public Supabase CDN URL. */
export function storageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path.replace(/^\/+/, "")}`;
}

/**
 * Free-form copy → a meta description. Collapses whitespace and cuts at a word
 * boundary near `max` (Google renders roughly 155 characters), so a long product
 * description never ends mid-word.
 */
export function metaDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function productJsonLd(product: ProductWithPhotos) {
  // The price a buyer actually pays, as a plain decimal string ("1250.00").
  const centavos = product.discounted_price_centavos ?? product.price_centavos;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.photos.map((photo) => storageUrl(photo.display_path)),
    description: product.description ?? product.name,
    sku: product.code,
    brand: { "@type": "Brand", name: "Torisabi" },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "PHP",
      price: centavosToInput(centavos),
      availability: AVAILABILITY[product.status],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Torisabi",
    url: absoluteUrl("/"),
    logo: absoluteUrl(LOGO_PATH),
    sameAs: [FACEBOOK_PROFILE_URL, INSTAGRAM_URL, TIKTOK_URL],
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Site-relative path, e.g. "/products". */
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
