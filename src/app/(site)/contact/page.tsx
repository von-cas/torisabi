import type { Metadata } from "next";
import Link from "next/link";

import { ContentPage, Section } from "@/components/site/content";
import {
  INSTAGRAM_DM_URL,
  INSTAGRAM_PROFILE_URL,
  INSTAGRAM_USERNAME,
  InstagramIcon,
} from "@/components/site/instagram";
import { BUTTON, BUTTON_PRIMARY, SHADE } from "@/components/site/sticker";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Instagram DM is the fastest way to reach Torisabi. Hours, reply times, and where the parcels are packed.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <ContentPage
      title="Say hello"
      lead="Instagram is where I actually live. Messages there get answered fastest, and that is where orders are placed."
    >
      <Section title="Instagram — the main door">
        <p>
          Send a DM any time. If you are asking about a particular piece,
          include its name or its code and I can check it straight away.
        </p>
        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <a
            href={INSTAGRAM_DM_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={SHADE.magenta}
            className={BUTTON_PRIMARY}
          >
            <InstagramIcon className="size-4" />
            Message me on Instagram
          </a>
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={SHADE.aqua}
            className={BUTTON}
          >
            @{INSTAGRAM_USERNAME}
          </a>
        </div>
      </Section>

      <Section title="When I am at the table">
        <p>
          Monday to Saturday, 9:00 AM to 7:00 PM Philippine time (GMT+8).
          Anything sent outside those hours gets picked up the next working day.
        </p>
        <p>
          Most messages get a reply within a few hours. If a whole day goes by
          with nothing, please nudge me — messages from accounts I have not
          spoken to before often land in the requests folder, where Instagram
          quietly hides them.
        </p>
      </Section>

      <Section title="Other ways to reach me">
        <p>
          A Facebook page and an email address are on the list. Until they
          exist, Instagram is the only way in, and there is no contact form
          here on purpose — a DM gets you an answer faster than a web form ever
          would.
        </p>
      </Section>

      <Section title="Where I am">
        <p>
          Everything is made and packed in Zamboanga, and posted anywhere in the
          Philippines through the usual couriers. There is no shop you can walk
          into — it is a table, not a store — so pickups are arranged case by
          case in the DM.
        </p>
        <p>
          <Link
            href="/shipping"
            className="font-semibold text-magenta-ink hover:underline"
          >
            Shipping information
          </Link>
        </p>
      </Section>
    </ContentPage>
  );
}
