import type { Metadata } from "next";
import Link from "next/link";

import { ContentPage, Section } from "@/components/site/content";
import { INSTAGRAM_DM_URL, InstagramIcon } from "@/components/site/instagram";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "How to Order",
  description:
    "Ordering from Torisabi takes a few taps: copy the order message, send it on Instagram, and we confirm stock, shipping, and payment in the DM.",
  alternates: { canonical: "/how-to-order" },
};

const STEPS = [
  "Browse the product gallery.",
  "Choose your item.",
  "Tap Copy Order Message, then Order on Instagram.",
  "Send the message with the product name or code.",
  "Provide your delivery location.",
  "Wait for stock and shipping-fee confirmation.",
  "Pay through the agreed method.",
  "Receive order confirmation and delivery details.",
];

export default function HowToOrderPage() {
  return (
    <ContentPage
      title="How to Order"
      lead="There is no cart and no checkout here. Every order happens in an Instagram DM, which keeps things personal and lets us confirm stock and shipping before you pay."
    >
      <Section title="Step by step">
        <ol className="list-decimal space-y-2 pl-5">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Section>

      <Section title="Please note">
        <p className="rounded-xl border border-brand/25 bg-brand-soft/40 px-4 py-3 text-foreground">
          An inquiry does not reserve a product. An order is confirmed only after
          Torisabi approves it and receives payment.
        </p>
        <p>
          Items move quickly and are often one of a kind, so the first confirmed
          and paid order is the one that gets the piece.
        </p>
      </Section>

      <Section title="Payment and delivery">
        <p>
          Payment methods are agreed in the DM — GCash, bank transfer, and cash
          on delivery are the usual options. Shipping fees depend on where the
          order is going, and free shipping applies to orders worth ₱3,000 or
          more.
        </p>
        <p>
          <Link href="/shipping" className="font-medium text-brand hover:underline">
            See shipping details
          </Link>
          {" · "}
          <Link href="/policies" className="font-medium text-brand hover:underline">
            Read the policies
          </Link>
        </p>
      </Section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/products"
          className={cn(buttonVariants({ variant: "default" }), "h-12 px-6")}
        >
          Browse Products
        </Link>
        <a
          href={INSTAGRAM_DM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "h-12 px-6")}
        >
          <InstagramIcon className="size-4" />
          Order on Instagram
        </a>
      </div>
    </ContentPage>
  );
}
