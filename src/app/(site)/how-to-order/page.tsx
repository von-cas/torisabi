import type { Metadata } from "next";
import Link from "next/link";

import { Callout, ContentPage, Section } from "@/components/site/content";
import { INSTAGRAM_DM_URL, InstagramIcon } from "@/components/site/instagram";
import { BUTTON, BUTTON_PRIMARY, SHADE } from "@/components/site/sticker";

export const metadata: Metadata = {
  title: "How to Order",
  description:
    "Ordering from Torisabi takes a few taps: copy the order message, send it on Instagram, and we sort out stock, shipping and payment in the DM.",
  alternates: { canonical: "/how-to-order" },
};

const STEPS = [
  "Have a look through the shelf.",
  "Pick the piece you want.",
  "Tap Copy order message, then Order on Instagram.",
  "Send the message — the name and the code are already in it.",
  "Tell me where it is going.",
  "Wait for me to confirm the piece is free and quote the shipping.",
  "Pay the way we agreed.",
  "I confirm the order and send you the tracking details.",
];

export default function HowToOrderPage() {
  return (
    <ContentPage
      title="How to order"
      lead="There is no cart here and no checkout page. Every order starts as a message, which means I can check the piece is still free, work out your shipping, and answer anything before you pay."
    >
      <Section title="Step by step">
        <ol className="list-decimal space-y-2 pl-6 marker:font-hand marker:text-lg marker:font-extrabold marker:text-magenta-ink">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Section>

      <Section title="Worth knowing">
        <Callout>
          Asking about a piece does not reserve it. An order is confirmed only
          once I approve it and payment is in.
        </Callout>
        <p>
          Most things here are made one at a time, so there is usually only one
          of them. If two people ask on the same day, the first confirmed and
          paid order is the one that gets it — nothing personal, it is just the
          only fair way to do it.
        </p>
        <p>
          If a piece has already gone and you would like something like it, ask.
          I can often make another, and I will tell you honestly how long it
          will take.
        </p>
      </Section>

      <Section title="Paying and posting">
        <p>
          We settle payment in the DM — usually GCash, a bank transfer, or cash
          on delivery where the courier offers it. Shipping depends on where the
          parcel is going, and it is free on orders over ₱3,000.
        </p>
        <p>
          <Link
            href="/shipping"
            className="font-semibold text-magenta-ink hover:underline"
          >
            See shipping details
          </Link>
          {" · "}
          <Link
            href="/policies"
            className="font-semibold text-magenta-ink hover:underline"
          >
            Read the policies
          </Link>
        </p>
      </Section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/products" style={SHADE.magenta} className={BUTTON_PRIMARY}>
          See what is on the shelf
        </Link>
        <a
          href={INSTAGRAM_DM_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={SHADE.aqua}
          className={BUTTON}
        >
          <InstagramIcon className="size-4" />
          Order on Instagram
        </a>
      </div>
    </ContentPage>
  );
}
