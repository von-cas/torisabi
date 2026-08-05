import type { Metadata } from "next";
import Link from "next/link";

import { Callout, ContentPage, Section } from "@/components/site/content";

export const metadata: Metadata = {
  title: "Shipping",
  description:
    "Shipping fees depend on your address and are confirmed on Facebook before you pay. Free shipping on orders over ₱3,000, sent from Zamboanga.",
  alternates: { canonical: "/shipping" },
};

const ADDRESS_FIELDS = [
  "Complete name",
  "Mobile number",
  "House number and street",
  "Barangay",
  "City or municipality",
  "Province",
  "Postal code",
  "Anything the rider should know — landmarks, gate instructions, best time to knock",
];

export default function ShippingPage() {
  return (
    <ContentPage
      title="Getting it to you"
      lead="Everything goes out from Zamboanga through the usual local couriers. What it costs depends on how far it has to travel, and I always tell you the exact figure before you pay."
    >
      <Callout>Free shipping on orders over ₱3,000.</Callout>

      <Section title="How the free-shipping promise works">
        <p>
          It is a promise I keep by hand, not a calculation the website makes —
          there is no cart here and nothing adds up your order automatically. I
          apply it in the DM, based on the total after any discount.
        </p>
        <p>
          Very large, very fragile, or hard-to-reach deliveries can fall outside
          it. If that is the case for your order, you will hear it from me
          before you pay, not after.
        </p>
      </Section>

      <Section title="What I need from you">
        <p>Send these in the DM once your order is confirmed:</p>
        <ul className="list-disc space-y-2 pl-6 marker:text-magenta">
          {ADDRESS_FIELDS.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      </Section>

      <Section title="Then what happens">
        <p>
          I quote the courier fee and the final amount. You pay once you are
          happy with it, I pack the piece — wrapped properly, because half of
          these are fragile — and I send you the courier and the tracking number
          as soon as it is out of my hands.
        </p>
        <p>
          <Link
            href="/how-to-order"
            className="font-semibold text-magenta-ink hover:underline"
          >
            See the full ordering steps
          </Link>
        </p>
      </Section>
    </ContentPage>
  );
}
