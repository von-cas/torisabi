"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import {
  MESSENGER_URL,
  FACEBOOK_PROFILE_URL,
  MessengerIcon,
} from "@/components/site/messenger";
import { NAV_LINKS } from "@/components/site/nav";
import { BUTTON_PRIMARY, SHADE } from "@/components/site/sticker";
import { Wordmark } from "@/components/site/wordmark";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** A different colour beside each menu row, the way the logo alternates. */
const DOTS = [
  "bg-magenta",
  "bg-aqua",
  "bg-grape",
  "bg-lemon",
  "bg-leaf",
  "bg-berry",
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-paper">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          aria-label="Torisabi — home"
          className="shrink-0 rounded-xl"
        >
          <Wordmark width={140} priority />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-3 py-2 text-[0.95rem] font-medium transition-colors",
                  active ? "text-magenta-ink" : "text-ink/70 hover:text-ink",
                )}
              >
                {link.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 bottom-0.5 h-[3px] rounded-full bg-magenta"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={MESSENGER_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={SHADE.magenta}
            className={cn(BUTTON_PRIMARY, "hidden px-5 text-sm lg:inline-flex")}
          >
            <MessengerIcon className="size-4" />
            Message to order
          </a>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            style={SHADE.aqua}
            className="sticker sticker-lift inline-flex size-12 shrink-0 items-center justify-center rounded-2xl lg:hidden"
          >
            {open ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div id="site-mobile-menu" className="bg-paper lg:hidden">
          <nav
            aria-label="Main"
            className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-4 sm:px-6"
          >
            {NAV_LINKS.map((link, index) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-13 items-center gap-3 rounded-xl px-2 font-hand text-xl font-bold",
                    active ? "text-magenta-ink" : "text-ink",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      DOTS[index % DOTS.length],
                    )}
                  />
                  {link.label}
                </Link>
              );
            })}
            <a
              href={FACEBOOK_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex min-h-13 items-center gap-3 rounded-xl px-2 font-hand text-xl font-bold text-ink"
            >
              <MessengerIcon className="size-4 shrink-0 text-magenta" />
              Facebook
            </a>
            <a
              href={MESSENGER_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={SHADE.magenta}
              className={cn(BUTTON_PRIMARY, "mt-3 mb-2 w-full")}
            >
              <MessengerIcon className="size-4" />
              Message to order
            </a>
          </nav>
        </div>
      )}

      {/* Signature: the same doodle line closes the header, opens the footer,
          and underlines every page title. */}
      <div aria-hidden="true" className="squiggle text-magenta" />
    </header>
  );
}
