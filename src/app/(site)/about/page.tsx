import type { Metadata } from "next";
import Link from "next/link";

import { ContentPage, Section } from "@/components/site/content";
import {
  INSTAGRAM_PROFILE_URL,
  INSTAGRAM_USERNAME,
  InstagramIcon,
} from "@/components/site/instagram";

export const metadata: Metadata = {
  title: "About",
  description:
    "Torisabi is a small, carefully curated shop in the Philippines. Every piece is chosen by hand and sold through Instagram.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    title: "Chosen, not stocked",
    body: "Nothing is bought in bulk. Each piece is picked one at a time, and only if we would happily keep it ourselves.",
  },
  {
    title: "Honest listings",
    body: "Real photos, clear prices, and an availability badge that is updated the moment something is reserved or sold.",
  },
  {
    title: "A real conversation",
    body: "Orders happen in the DM with a person, not a checkout robot. Ask anything before you commit.",
  },
];

export default function AboutPage() {
  return (
    <ContentPage
      title="About Torisabi"
      lead="A small shop for beautiful finds — carefully selected, honestly described, and sent out with care."
    >
      <Section title="Our story">
        <p>
          Torisabi started the way most good collections do: with one item that
          was too lovely to leave behind. What began as personal finds turned
          into a small shop, run from the Philippines, for people who would
          rather own a few things they love than many things they do not.
        </p>
        <p>
          The collection stays deliberately small. New pieces are added as they
          are found, which is why the gallery changes often and why items rarely
          come back once they are gone.
        </p>
      </Section>

      <Section title="What we offer">
        <p>
          Hand-picked home pieces, accessories, and everyday objects — each one
          photographed as it actually looks, priced in Philippine pesos, and
          listed with its condition and variations. Sold items stay on the site
          so you can see the kind of thing we look for.
        </p>
      </Section>

      <Section title="What we care about">
        <ul className="space-y-4">
          {VALUES.map((value) => (
            <li key={value.title}>
              <p className="font-medium text-foreground">{value.title}</p>
              <p className="mt-1">{value.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="A note from the owner">
        <blockquote className="border-l-2 border-brand pl-4 italic">
          Thank you for being here. Every order, big or small, is packed by hand
          and means a great deal to this little shop. If you have a question
          about a piece, please send a message — I would love to hear from you.
        </blockquote>
      </Section>

      <Section title="Follow along">
        <p>
          New finds are posted on Instagram first, and that is also where orders
          happen.
        </p>
        <p className="flex flex-wrap gap-4">
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-medium text-brand hover:underline"
          >
            <InstagramIcon className="size-4" />@{INSTAGRAM_USERNAME}
          </a>
          <Link href="/contact" className="font-medium text-brand hover:underline">
            Contact details
          </Link>
        </p>
      </Section>
    </ContentPage>
  );
}
