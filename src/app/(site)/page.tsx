import Link from "next/link";

import { INSTAGRAM_DM_URL, InstagramIcon } from "@/components/site/instagram";
import { ProductCard } from "@/components/site/product-card";
import {
  safeGetCategories,
  safeGetFeaturedProducts,
} from "@/components/site/safe-queries";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

const STEPS = [
  {
    title: "Browse and choose",
    body: "Look through the gallery and open the piece you like for photos, price, and details.",
  },
  {
    title: "Copy and send",
    body: "Tap Copy Order Message, then Order on Instagram, and paste it into the DM.",
  },
  {
    title: "Confirm and receive",
    body: "We confirm stock, shipping fee, and payment in the DM, then send your order on its way.",
  },
];

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    safeGetFeaturedProducts(6),
    safeGetCategories(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-linear-to-b from-brand-soft/45 to-background">
        <div className={cn(CONTAINER, "py-16 sm:py-24")}>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-brand">
            Torisabi
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Beautiful finds, carefully selected for you.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A small, hand-picked collection of pieces we genuinely love. Browse
            the catalog here, then order in a few taps through Instagram — no
            accounts, no checkout, just a message.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/products"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-12 px-6 text-base",
              )}
            >
              Browse Products
            </Link>
            <a
              href={INSTAGRAM_DM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 px-6 text-base",
              )}
            >
              <InstagramIcon className="size-4" />
              Order on Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Free-shipping promo */}
      <section className={CONTAINER}>
        <p className="rounded-xl border border-brand/25 bg-brand-soft/50 px-5 py-4 text-center text-sm font-medium text-foreground sm:text-base">
          Free shipping for orders worth ₱3,000 or more.
          <Link
            href="/shipping"
            className="ml-2 font-medium text-brand hover:underline"
          >
            See shipping details
          </Link>
        </p>
      </section>

      {/* Featured products */}
      <section className={cn(CONTAINER, "py-14 sm:py-16")}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Featured pieces
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Newly added and favourites from the collection.
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-medium text-brand hover:underline"
          >
            View all products
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="text-base font-medium">No products yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              The first pieces are on their way. Follow along on Instagram to see
              them the moment they are listed.
            </p>
            <a
              href={INSTAGRAM_DM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-5 h-11 px-5",
              )}
            >
              <InstagramIcon className="size-4" />
              Message us on Instagram
            </a>
          </div>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className={cn(CONTAINER, "pb-14 sm:pb-16")}>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Shop by category
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/products?category=${encodeURIComponent(category)}`}
                className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-5 text-sm font-medium transition-colors hover:border-brand/50 hover:text-brand"
              >
                {category}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How ordering works */}
      <section className="border-y border-border bg-secondary/40">
        <div className={cn(CONTAINER, "py-14 sm:py-16")}>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            How ordering works
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-medium">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <Link
            href="/how-to-order"
            className="mt-8 inline-flex text-sm font-medium text-brand hover:underline"
          >
            Read the full ordering guide
          </Link>
        </div>
      </section>
    </>
  );
}
