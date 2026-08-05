import Link from "next/link";

import {
  INSTAGRAM_DM_URL,
  INSTAGRAM_PROFILE_URL,
  INSTAGRAM_USERNAME,
  InstagramIcon,
} from "@/components/site/instagram";
import { NAV_LINKS } from "@/components/site/nav";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/50">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="space-y-3">
          <p className="text-base font-semibold uppercase tracking-[0.2em]">
            Torisabi
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Beautiful finds, carefully selected for you. Browse the catalog here
            and order through Instagram.
          </p>
          <p className="text-sm font-medium text-brand">
            Free shipping for orders worth ₱3,000 or more.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Explore</h2>
          <ul className="mt-3 space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/policies"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Policies
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Order</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Orders are placed through Instagram DM. Copy the order message on any
            product page, then send it over.
          </p>
          <a
            href={INSTAGRAM_DM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
          >
            <InstagramIcon className="size-4" />
            Message us on Instagram
          </a>
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-sm text-muted-foreground hover:text-foreground"
          >
            @{INSTAGRAM_USERNAME}
          </a>
        </div>
      </div>

      <div className="border-t border-border">
        {/* Extra bottom padding clears the floating mobile order button. */}
        <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 text-xs text-muted-foreground sm:px-6 lg:px-8 lg:pb-6">
          © {new Date().getFullYear()} Torisabi. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
