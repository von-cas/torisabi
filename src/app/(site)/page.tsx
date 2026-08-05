import type { Metadata } from "next";
import Link from "next/link";

import { Sparkle, Strawberry } from "@/components/site/doodles";
import { MESSENGER_URL, MessengerIcon } from "@/components/site/messenger";
import { JsonLd } from "@/components/site/json-ld";
import { ProductCard } from "@/components/site/product-card";
import {
  safeGetCategories,
  safeGetFeaturedProducts,
} from "@/components/site/safe-queries";
import {
  BUTTON,
  BUTTON_PRIMARY,
  SHADE,
  shadeFor,
} from "@/components/site/sticker";
import { organizationJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

// `absolute` keeps the home page off the "%s | Torisabi" template — the brand is
// already in the title, and "Home | Torisabi" says less to a searcher.
export const metadata: Metadata = {
  title: { absolute: "Torisabi — your daily crafter in Zamboanga" },
  description:
    "Small handmade things, made one at a time in Zamboanga. Browse the shelf for photos, prices and what is still available, then order in a few taps on Facebook.",
  alternates: { canonical: "/" },
};

const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

/** The promise, on repeat — the washi tape across the middle of the page. */
const PROMISES = [
  "Made by hand",
  "One at a time",
  "Packed with a note",
  "Sent from Zamboanga",
];

/** Ordering really is a sequence, so the steps really are numbered. */
const STEPS = [
  {
    title: "Pick your piece",
    body: "Have a look through the shelf and open anything you like for more photos, the price, and what it is made of.",
    shade: SHADE.magenta,
  },
  {
    title: "Copy and send",
    body: "Tap Message to order and it opens a Facebook chat with me. Tell me the piece — that is the whole checkout.",
    shade: SHADE.aqua,
  },
  {
    title: "I pack it up",
    body: "We settle the shipping fee and payment in the DM, then it goes out wrapped, with your name on it.",
    shade: SHADE.grape,
  },
];

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    safeGetFeaturedProducts(6),
    safeGetCategories(),
  ]);

  return (
    <>
      <JsonLd data={organizationJsonLd()} />

      {/* Hero — the wordmark's own trick, used at headline size: the thing she
          calls herself, set in the logo's letters. */}
      <section className={cn(CONTAINER, "pt-10 sm:pt-14 lg:pt-16")}>
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <p className="inline-flex -rotate-2 items-center gap-2 rounded-full border-2 border-grape px-3 py-1 text-xs font-bold tracking-[0.16em] text-grape uppercase">
              <Sparkle className="size-3.5" />
              Zamboanga · Philippines
            </p>

            <h1 className="mt-5 font-hand text-[3.25rem] leading-[0.95] font-extrabold tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Your daily
              <br />
              <span className="marker">crafter</span>
            </h1>

            <div
              aria-hidden="true"
              className="squiggle mt-4 w-36 text-magenta"
            />

            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/75">
              Hi, I am the pair of hands behind Torisabi. I make small things at
              my craft table — a few new ones most weeks — and send them out to
              wherever you are.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                style={SHADE.magenta}
                className={BUTTON_PRIMARY}
              >
                See what is on the shelf
              </Link>
              <a
                href={MESSENGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={SHADE.aqua}
                className={BUTTON}
              >
                <MessengerIcon className="size-4" />
                Message us on Facebook
              </a>
            </div>
          </div>

          {/* Taped on at an angle, deliberately off the grid. */}
          <div
            style={SHADE.aqua}
            className="sticker rotate-2 rounded-3xl p-6 sm:p-7 lg:col-span-5 lg:-mt-2 lg:translate-x-3 lg:rotate-3"
          >
            <Strawberry className="size-9" />
            <p className="mt-3 font-hand text-2xl leading-tight font-extrabold text-ink sm:text-3xl">
              Free shipping on ₱3,000 and up
            </p>
            <p className="mt-2 leading-relaxed text-ink/75">
              Anywhere in the Philippines. Under that, I check the courier fee
              for your address and tell you before you pay a thing.
            </p>
            <Link
              href="/shipping"
              className="mt-4 inline-flex font-semibold text-magenta-ink hover:underline"
            >
              How shipping works →
            </Link>
          </div>
        </div>
      </section>

      {/* The promise, on tape. */}
      <section className="overflow-hidden py-12 sm:py-16">
        <div className="-mx-[3%] w-[106%] -rotate-[1.2deg] border-y-2 border-ink bg-lemon py-3">
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 text-center font-hand text-lg font-bold text-ink sm:text-xl">
            {PROMISES.map((promise, index) => (
              <span key={promise} className="inline-flex items-center gap-3">
                {promise}
                {index < PROMISES.length - 1 && (
                  <span aria-hidden="true" className="text-ink/40">
                    ·
                  </span>
                )}
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* Featured */}
      <section className={cn(CONTAINER, "pb-14 sm:pb-16")}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-hand text-3xl font-extrabold text-ink sm:text-4xl">
              On the shelf right now
            </h2>
            <div
              aria-hidden="true"
              className="squiggle mt-2 w-24 text-magenta"
            />
          </div>
          <Link
            href="/products"
            className="font-semibold text-magenta-ink hover:underline"
          >
            See everything →
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div
            style={SHADE.aqua}
            className="sticker mt-8 -rotate-1 rounded-3xl px-6 py-12 text-center"
          >
            <Strawberry className="mx-auto size-10" />
            <p className="mt-4 font-hand text-2xl font-extrabold text-ink sm:text-3xl">
              The shelf is empty — for now
            </p>
            <p className="mx-auto mt-2 max-w-md leading-relaxed text-ink/75">
              I am making the first batch. Everything goes up here the moment it
              is finished, and it lands on Facebook first.
            </p>
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
          </div>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className={cn(CONTAINER, "pb-14 sm:pb-16")}>
          <h2 className="font-hand text-3xl font-extrabold text-ink sm:text-4xl">
            Browse by kind
          </h2>
          <div className="mt-6 flex flex-wrap gap-4">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/products?category=${encodeURIComponent(category)}`}
                style={shadeFor(category)}
                className="sticker sticker-lift inline-flex min-h-11 items-center rounded-full px-5 font-semibold text-ink"
              >
                {category}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How ordering works */}
      <section className={cn(CONTAINER, "pb-16 sm:pb-20")}>
        <div aria-hidden="true" className="squiggle text-magenta" />
        <h2 className="mt-10 font-hand text-3xl font-extrabold text-ink sm:text-4xl">
          Three steps and it is yours
        </h2>
        <p className="mt-2 max-w-xl leading-relaxed text-ink/75">
          There is no cart and no checkout here. Everything happens in an
          Facebook Messenger, with an actual person on the other end.
        </p>

        <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span
                style={step.shade}
                className="sticker grid size-12 shrink-0 place-items-center rounded-full font-hand text-xl font-extrabold text-ink"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="font-hand text-xl font-bold text-ink">
                  {step.title}
                </h3>
                <p className="mt-1 leading-relaxed text-ink/75">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <Link
          href="/how-to-order"
          className="mt-8 inline-flex font-semibold text-magenta-ink hover:underline"
        >
          Read the full ordering guide →
        </Link>
      </section>
    </>
  );
}
