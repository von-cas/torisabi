import type { Metadata } from "next";
import Link from "next/link";

import { ContentPage, Section } from "@/components/site/content";

export const metadata: Metadata = {
  title: "Shipping",
  description:
    "Shipping fees depend on your location and are confirmed on Instagram before payment. Free shipping for orders worth ₱3,000 or more.",
};

const ADDRESS_FIELDS = [
  "Complete name",
  "Mobile number",
  "House number and street",
  "Barangay",
  "City or municipality",
  "Province",
  "Postal code",
  "Delivery notes (landmarks, preferred time, gate instructions)",
];

export default function ShippingPage() {
  return (
    <ContentPage
      title="Shipping Information"
      lead="Shipping fees depend on your location. We confirm the exact fee in the DM before any payment, so there are no surprises."
    >
      <p className="rounded-xl border border-brand/25 bg-brand-soft/50 px-5 py-4 text-center text-base font-medium text-foreground">
        Free shipping for orders worth ₱3,000 or more.
      </p>

      <Section title="How the free-shipping promo works">
        <p>
          This is a displayed promotion, not an automatic calculation — the
          website has no cart and does not total your order. We apply the
          threshold in the DM, based on the product total after any discounts.
        </p>
        <p>
          Special, oversized, or remote-area deliveries may be excluded. If an
          exclusion applies to your order, we tell you before you pay.
        </p>
      </Section>

      <Section title="What we need for delivery">
        <p>Send these details in the DM once your order is confirmed:</p>
        <ul className="list-disc space-y-2 pl-5">
          {ADDRESS_FIELDS.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      </Section>

      <Section title="Confirming the fee">
        <p>
          Once we have your delivery address, we quote the shipping fee and the
          final amount. Payment comes after you agree to that amount, and we
          share the courier and tracking number as soon as the parcel is out.
        </p>
        <p>
          <Link
            href="/how-to-order"
            className="font-medium text-brand hover:underline"
          >
            See the full ordering steps
          </Link>
        </p>
      </Section>
    </ContentPage>
  );
}
