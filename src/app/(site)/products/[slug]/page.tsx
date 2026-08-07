import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/site/json-ld";
import { OrderButtons } from "@/components/site/order-buttons";
import { ProductPhotos } from "@/components/site/product-photos";
import { safeGetProductBySlug } from "@/components/site/safe-queries";
import { StatusBadge } from "@/components/site/status-badge";
import { SHADE } from "@/components/site/sticker";
import { formatPeso } from "@/lib/money";
import { getAllProductSlugs } from "@/lib/queries";
import {
  breadcrumbJsonLd,
  metaDescription,
  productJsonLd,
  storageUrl,
} from "@/lib/seo";

// Cached (ISR): served from cache, not re-rendered per visitor. Purged the
// instant an admin changes a product via /api/revalidate; the hour is only a
// backstop. See MASTER-PLAN.md §10.
export const revalidate = 3600;

/**
 * Listing the current slugs is what turns this dynamic route into an ISR one —
 * `revalidate` alone is ignored without it. Known products prerender; a newly
 * published one isn't in the list, so it renders on the first visit and is
 * cached from then on (dynamicParams stays true). If Supabase is unreachable at
 * build, every page just renders on demand rather than failing the build.
 */
export async function generateStaticParams() {
  try {
    const slugs = await getAllProductSlugs();
    return slugs.map(({ slug }) => ({ slug }));
  } catch {
    return [];
  }
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await safeGetProductBySlug(slug);

  if (!product) return { title: "Product not found", robots: { index: false } };

  const path = `/products/${product.slug}`;
  const description = metaDescription(
    product.description ??
      `${product.name} (${product.code}) from the Torisabi collection. Order through Facebook.`,
  );
  // Only the first photo — an OG image list is a preview, not a gallery. No
  // photo yet means no image tag at all, never a URL that resolves to nothing.
  const cover = product.photos[0];

  return {
    title: product.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "Torisabi",
      locale: "en_PH",
      title: product.name,
      description,
      url: path,
      images: cover
        ? [
            {
              url: storageUrl(cover.display_path),
              alt: cover.alt_text ?? product.name,
            },
          ]
        : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await safeGetProductBySlug(slug);

  if (!product) notFound();

  const hasDiscount = product.discounted_price_centavos !== null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <JsonLd data={productJsonLd(product)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
          { name: product.name, path: `/products/${product.slug}` },
        ])}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-ink/60">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-magenta-ink">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/products" className="hover:text-magenta-ink">
              The shelf
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductPhotos
          photos={product.photos}
          name={product.name}
          sold={product.status === "sold_out"}
        />

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={product.status} />
              {/* The code is how a piece gets named in the DM, so it is set
                  like the stamp on a stock tag. */}
              <span className="inline-flex items-center rounded-full bg-ink px-2.5 py-1 font-mono text-xs font-medium tracking-wider text-paper">
                {product.code}
              </span>
              {product.category && (
                <Link
                  href={`/products?category=${encodeURIComponent(product.category)}`}
                  className="inline-flex items-center rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-semibold text-ink hover:bg-magenta-soft"
                >
                  {product.category}
                </Link>
              )}
            </div>

            <h1 className="font-hand text-4xl leading-[1.05] font-extrabold tracking-tight break-words text-ink sm:text-5xl">
              {product.name}
            </h1>

            <p className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold text-ink">
                {formatPeso(
                  product.discounted_price_centavos ?? product.price_centavos,
                )}
              </span>
              {hasDiscount && (
                <span className="text-lg text-ink/50 line-through">
                  {formatPeso(product.price_centavos)}
                </span>
              )}
            </p>
          </div>

          {product.description && (
            <p className="leading-relaxed break-words whitespace-pre-line text-ink/75">
              {product.description}
            </p>
          )}

          {product.variations.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-hand text-lg font-bold text-ink">
                Comes in
              </h2>
              <ul className="flex flex-wrap gap-2">
                {product.variations.map((variation) => (
                  <li
                    key={variation}
                    className="inline-flex items-center rounded-full border-2 border-ink bg-paper px-3 py-1 text-sm font-semibold text-ink"
                  >
                    {variation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <OrderButtons
            name={product.name}
            code={product.code}
            status={product.status}
          />

          <div
            style={SHADE.lemon}
            className="sticker rounded-2xl p-5 leading-relaxed text-ink/75"
          >
            <p className="font-hand text-lg font-bold text-ink">
              Getting it to you
            </p>
            <p className="mt-1">
              The courier fee depends on your address, and I always confirm it
              in the DM before you pay anything. Orders over ₱3,000 ship free.
            </p>
            <Link
              href="/shipping"
              className="mt-2 inline-flex font-semibold text-magenta-ink hover:underline"
            >
              Shipping details →
            </Link>
          </div>

          <p className="text-sm leading-relaxed text-ink/60">
            Asking about a piece does not reserve it. An order is confirmed once
            I approve it and payment is in.
          </p>
        </div>
      </div>

      <Link
        href="/products"
        className="mt-12 inline-flex font-semibold text-magenta-ink hover:underline"
      >
        ← Back to the shelf
      </Link>
    </div>
  );
}
