import type { Metadata } from "next";
import Link from "next/link";

import { ContentPage, Section } from "@/components/site/content";
import {
  INSTAGRAM_DM_URL,
  INSTAGRAM_PROFILE_URL,
  INSTAGRAM_USERNAME,
  InstagramIcon,
} from "@/components/site/instagram";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Instagram DM is the fastest way to reach Torisabi. Business hours, response times, and where we ship from.",
};

export default function ContactPage() {
  return (
    <ContentPage
      title="Contact"
      lead="Instagram is our main channel — messages there get answered fastest, and that is where orders are placed."
    >
      <Section title="Instagram (primary)">
        <p>
          Send a DM any time. If you are asking about a specific item, include
          the product name or code so we can check it right away.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={INSTAGRAM_DM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-12 px-6",
              "bg-brand text-brand-foreground hover:bg-brand/90",
            )}
          >
            <InstagramIcon className="size-4" />
            Message us on Instagram
          </a>
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "h-12 px-6")}
          >
            @{INSTAGRAM_USERNAME}
          </a>
        </div>
      </Section>

      <Section title="Business hours and response time">
        <p>
          Monday to Saturday, 9:00 AM to 7:00 PM Philippine time (GMT+8).
          Messages sent outside these hours are answered the next working day.
        </p>
        <p>
          Most DMs get a reply within a few hours during business hours. If a day
          passes without an answer, please send a follow-up — messages from new
          accounts sometimes land in the requests folder.
        </p>
      </Section>

      <Section title="Other channels">
        <p>
          A Facebook page and an email address are coming soon. Until then,
          Instagram is the only place to reach us, and we do not use a contact
          form.
        </p>
      </Section>

      <Section title="Where we are">
        <p>
          Torisabi is based in the Philippines and ships nationwide through local
          couriers. We are an online shop with no walk-in address, so pickups are
          arranged case by case in the DM.
        </p>
        <p>
          <Link
            href="/shipping"
            className="font-medium text-brand hover:underline"
          >
            Shipping information
          </Link>
        </p>
      </Section>
    </ContentPage>
  );
}
