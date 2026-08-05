import Link from "next/link";

import { Strawberry } from "@/components/site/doodles";
import {
  MESSENGER_URL,
  FACEBOOK_PROFILE_URL,
  FACEBOOK_LABEL,
  MessengerIcon,
} from "@/components/site/messenger";
import { NAV_LINKS } from "@/components/site/nav";
import { Wordmark } from "@/components/site/wordmark";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-paper">
      <div aria-hidden="true" className="squiggle text-magenta" />

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="space-y-4">
          <Wordmark width={158} />
          <p className="max-w-xs leading-relaxed text-ink/70">
            Small handmade things, made one at a time in Zamboanga and sent
            anywhere in the Philippines.
          </p>
          <p className="flex items-start gap-2 font-hand text-lg font-bold text-magenta-ink">
            <Strawberry className="mt-0.5 size-5 shrink-0" />
            Free shipping on orders over ₱3,000
          </p>
        </div>

        <div>
          <h2 className="font-hand text-xl font-bold">Look around</h2>
          <ul className="mt-3 space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-ink/70 transition-colors hover:text-magenta-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/policies"
                className="text-ink/70 transition-colors hover:text-magenta-ink"
              >
                Policies
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-hand text-xl font-bold">Order</h2>
          <p className="mt-3 leading-relaxed text-ink/70">
            Every order happens in a Facebook Messenger chat. Tap Message to order on any
            product page and send it over — I answer as soon as I am off the
            craft table.
          </p>
          <a
            href={MESSENGER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 font-semibold text-magenta-ink hover:underline"
          >
            <MessengerIcon className="size-4" />
            Message me on Facebook
          </a>
          <a
            href={FACEBOOK_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-ink/70 hover:text-magenta-ink"
          >
            {FACEBOOK_LABEL}
          </a>
        </div>
      </div>

      {/* Extra bottom padding clears the floating mobile order button. */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 pb-24 text-sm text-ink/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 lg:pb-8">
        <p>Glue, glitter and a lot of patience. Zamboanga, Philippines.</p>
        <p>© {new Date().getFullYear()} Torisabi</p>
      </div>
    </footer>
  );
}
