import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderButtons } from "@/components/site/order-buttons";
import { ProductPhotos } from "@/components/site/product-photos";
import { safeGetProductBySlug } from "@/components/site/safe-queries";
import { StatusBadge } from "@/components/site/status-badge";
import { formatPeso } from "@/lib/money";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await safeGetProductBySlug(slug);

  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description:
      product.description?.slice(0, 160) ??
      `${product.name} (${product.code}) from the Torisabi collection. Order through Instagram.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await safeGetProductBySlug(slug);

  if (!product) notFound();

  const hasDiscount = product.discounted_price_centavos !== null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/products" className="hover:text-foreground">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductPhotos
          photos={product.photos}
          name={product.name}
          sold={product.status === "sold_out"}
        />

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={product.status} />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {product.code}
              </span>
              {product.category && (
                <Link
                  href={`/products?category=${encodeURIComponent(product.category)}`}
                  className="text-xs uppercase tracking-widest text-brand hover:underline"
                >
                  {product.category}
                </Link>
              )}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {product.name}
            </h1>

            <p className="flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-semibold sm:text-3xl">
                {formatPeso(
                  product.discounted_price_centavos ?? product.price_centavos,
                )}
              </span>
              {hasDiscount && (
                <span className="text-base text-muted-foreground line-through">
                  {formatPeso(product.price_centavos)}
                </span>
              )}
            </p>
          </div>

          {product.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
              {product.description}
            </p>
          )}

          {product.variations.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Variations</h2>
              <ul className="flex flex-wrap gap-2">
                {product.variations.map((variation) => (
                  <li
                    key={variation}
                    className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground"
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

          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Shipping</p>
            <p className="mt-1">
              Shipping fees depend on your delivery address and are confirmed in
              the DM before any payment. Free shipping for orders worth ₱3,000 or
              more.
            </p>
            <Link
              href="/shipping"
              className="mt-2 inline-flex font-medium text-brand hover:underline"
            >
              Shipping details
            </Link>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            An inquiry does not reserve a product. An order is confirmed only
            after we approve it and receive payment.
          </p>
        </div>
      </div>

      <Link
        href="/products"
        className="mt-12 inline-flex text-sm font-medium text-brand hover:underline"
      >
        ← Back to all products
      </Link>
    </div>
  );
}
