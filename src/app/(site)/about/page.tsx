import type { Metadata } from "next";
import Link from "next/link";

import { ContentPage, Section } from "@/components/site/content";
import { Strawberry } from "@/components/site/doodles";
import {
  INSTAGRAM_PROFILE_URL,
  INSTAGRAM_USERNAME,
  InstagramIcon,
} from "@/components/site/instagram";
import { SHADE } from "@/components/site/sticker";

export const metadata: Metadata = {
  title: "About",
  description:
    "Torisabi is one crafter in Zamboanga, Philippines, making small handmade things and selling them through Instagram.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    title: "Made, not bought in bulk",
    body: "Everything here left my own table. Nothing is ordered by the box and relabelled.",
  },
  {
    title: "Photos of the real thing",
    body: "The pictures are the actual piece you would receive, wonky bits and all. If something is imperfect, the listing says so.",
  },
  {
    title: "A person in the DMs",
    body: "No bot, no ticket number. Ask for more photos, measurements, or a different colour before you commit.",
  },
];

export default function AboutPage() {
  return (
    <ContentPage
      title="About Torisabi"
      lead="Your daily crafter — one pair of hands, a very messy table, and a shop that runs out of Zamboanga."
    >
      <Section title="How this started">
        <p>
          Torisabi began as a habit rather than a plan. I made something small,
          then something else the next day, then a friend asked whether she
          could buy one. That is genuinely the whole origin story.
        </p>
        <p>
          It is still that: I make a few new things most weeks and put them up
          here. Which is why the shelf changes so often, and why a piece that
          has gone rarely comes back in exactly the same form.
        </p>
      </Section>

      <Section title="What I make">
        <p>
          Small handmade things — the kind you keep on a desk, clip to a bag, or
          give to someone who notices details. Each one is photographed as it
          actually looks, priced in Philippine pesos, and listed with its
          colours and sizes. Sold pieces stay on the shelf so you can see the
          kind of work I do.
        </p>
        <p>
          If you have seen something here that has gone and you want one like
          it, just ask. Made-to-order is normal for me.
        </p>
      </Section>

      <Section title="What I care about">
        <ul className="space-y-4">
          {VALUES.map((value) => (
            <li key={value.title}>
              <p className="font-hand text-lg font-bold text-ink">
                {value.title}
              </p>
              <p className="mt-1">{value.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <div style={SHADE.magenta} className="sticker rounded-3xl p-6 sm:p-7">
        <Strawberry className="size-9" />
        <p className="mt-3 font-hand text-xl leading-snug font-bold text-ink sm:text-2xl">
          Thank you for being here.
        </p>
        <p className="mt-2 leading-relaxed text-ink/75">
          Every order, however small, gets packed by hand at the same table it
          was made on, and it means more to this little shop than you would
          guess. If you are curious about a piece, please send a message — I
          like talking about them.
        </p>
      </div>

      <Section title="Follow along">
        <p>
          New things go up on Instagram first, and that is also where orders
          happen.
        </p>
        <p className="flex flex-wrap gap-4">
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-magenta-ink hover:underline"
          >
            <InstagramIcon className="size-4" />@{INSTAGRAM_USERNAME}
          </a>
          <Link
            href="/contact"
            className="font-semibold text-magenta-ink hover:underline"
          >
            Contact details
          </Link>
        </p>
      </Section>
    </ContentPage>
  );
}
