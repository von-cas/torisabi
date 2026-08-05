import type { Metadata } from "next";
import Link from "next/link";

import { ContentPage, Section } from "@/components/site/content";

export const metadata: Metadata = {
  title: "Policies",
  description:
    "Reservations, payment, shipping, returns, exchanges, damaged items, cancellations, and privacy at Torisabi.",
};

export default function PoliciesPage() {
  return (
    <ContentPage
      title="Policies"
      lead="Short and plain, so you know exactly where you stand before you order."
    >
      <Section title="Reservations">
        <p>
          Asking about an item does not reserve it. A piece is marked Reserved
          only after we confirm the order in the DM, and it stays reserved for 24
          hours while payment is arranged. After that it goes back on sale.
        </p>
      </Section>

      <Section title="Payment">
        <p>
          Payment is arranged in the DM — usually GCash, bank transfer, or cash
          on delivery where available. The order is confirmed once payment (or a
          COD booking) is in place. We never ask for payment through any channel
          other than our own Instagram account.
        </p>
      </Section>

      <Section title="Shipping">
        <p>
          Fees depend on your delivery address and are quoted before payment.
          Free shipping applies to orders worth ₱3,000 or more, with possible
          exclusions for oversized or remote-area deliveries. Parcels are handed
          to the courier within two working days of confirmed payment, and the
          tracking number is sent to you.
        </p>
        <p>
          <Link
            href="/shipping"
            className="font-medium text-brand hover:underline"
          >
            Full shipping details
          </Link>
        </p>
      </Section>

      <Section title="Returns and exchanges">
        <p>
          Items are described and photographed as accurately as we can, and many
          are one of a kind, so returns for change of mind are not accepted.
          Please ask for extra photos or measurements before ordering — we are
          happy to send them.
        </p>
      </Section>

      <Section title="Damaged or incorrect items">
        <p>
          If a parcel arrives damaged or the wrong item was sent, message us
          within 48 hours of delivery with photos of the item and the packaging.
          We will replace it, or refund it in full when a replacement is not
          possible.
        </p>
        <p>
          Recording an unboxing video helps enormously if a courier claim is
          needed.
        </p>
      </Section>

      <Section title="Cancellations">
        <p>
          An order can be cancelled free of charge any time before it ships. Once
          it has been handed to the courier it can no longer be cancelled.
          Repeated cancellations or unclaimed COD parcels may mean we cannot
          accept future orders.
        </p>
      </Section>

      <Section title="Customer privacy">
        <p>
          The details you send — name, mobile number, and delivery address — are
          used only to process and deliver your order, and are shared only with
          the courier handling it. We do not sell or publish customer
          information, and we do not post screenshots of conversations without
          permission.
        </p>
        <p>
          This website has no cart, no accounts, and no tracking cookies. Ask us
          any time to delete the order details we hold for you.
        </p>
      </Section>
    </ContentPage>
  );
}
