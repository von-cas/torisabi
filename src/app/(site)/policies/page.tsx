import type { Metadata } from "next";
import Link from "next/link";

import { ContentPage, Section } from "@/components/site/content";

export const metadata: Metadata = {
  title: "Policies",
  description:
    "Reservations, payment, shipping, returns, damaged parcels, cancellations and privacy at Torisabi — short and in plain words.",
  alternates: { canonical: "/policies" },
};

export default function PoliciesPage() {
  return (
    <ContentPage
      title="The fine print"
      lead="Short, plain, and written so you know exactly where you stand before you order. If anything here is unclear, ask me and I will explain it properly."
    >
      <Section title="Holding a piece">
        <p>
          Asking about something does not hold it. A piece is marked Reserved
          only once I confirm the order in the DM, and it stays reserved for 24
          hours while payment is sorted. After that it goes back on the shelf.
        </p>
      </Section>

      <Section title="Paying">
        <p>
          Payment is arranged in the DM — usually GCash, a bank transfer, or
          cash on delivery where the courier offers it. The order is confirmed
          once payment or a COD booking is in place. I will never ask you to pay
          through any account other than my own, and I will never message you
          from a second account asking for money.
        </p>
      </Section>

      <Section title="Shipping">
        <p>
          The fee depends on your address and is quoted before you pay. Orders
          over ₱3,000 ship free, with the odd exception for oversized or
          hard-to-reach deliveries. Parcels go to the courier within two working
          days of confirmed payment, and I send you the tracking number.
        </p>
        <p>
          <Link
            href="/shipping"
            className="font-semibold text-magenta-ink hover:underline"
          >
            Full shipping details
          </Link>
        </p>
      </Section>

      <Section title="Returns and exchanges">
        <p>
          Handmade pieces are one-offs, and I describe and photograph them as
          honestly as I can, so I cannot take returns for a change of heart.
          Please ask for extra photos or measurements before you order — I am
          happy to send them, and I would much rather do that than have
          something arrive and disappoint you.
        </p>
      </Section>

      <Section title="If it arrives broken or wrong">
        <p>
          Message me within 48 hours of delivery with photos of the piece and
          the packaging. I will remake it or replace it, and refund you in full
          if neither is possible.
        </p>
        <p>
          Filming yourself opening the parcel helps enormously if the courier
          needs to be held to account.
        </p>
      </Section>

      <Section title="Cancelling">
        <p>
          You can cancel free of charge any time before the parcel ships. Once
          it is with the courier it cannot be pulled back. Repeated
          cancellations or unclaimed COD parcels mean I may not be able to take
          future orders — every unclaimed parcel costs a small shop real money.
        </p>
      </Section>

      <Section title="Your details">
        <p>
          What you send me — your name, mobile number and address — is used only
          to make and deliver your order, and shared only with the courier
          carrying it. I do not sell customer information, and I do not post
          screenshots of conversations without asking first.
        </p>
        <p>
          This website has no cart, no accounts and no tracking cookies. Ask me
          any time to delete the order details I hold for you.
        </p>
      </Section>
    </ContentPage>
  );
}
