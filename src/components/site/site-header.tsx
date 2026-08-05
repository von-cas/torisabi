"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import {
  INSTAGRAM_DM_URL,
  INSTAGRAM_PROFILE_URL,
  InstagramIcon,
} from "@/components/site/instagram";
import { NAV_LINKS } from "@/components/site/nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="text-base font-semibold uppercase tracking-[0.2em] text-foreground sm:text-lg"
        >
          Torisabi
        </Link>

        <nav
          aria-label="Main"
          className="hidden items-center gap-1 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors hover:text-foreground",
                isActive(pathname, link.href)
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Instagram
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={INSTAGRAM_DM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "default" }),
              "hidden h-10 px-4 lg:inline-flex",
              "bg-brand text-brand-foreground hover:bg-brand/90",
            )}
          >
            <InstagramIcon className="size-4" />
            Order on Instagram
          </a>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-11 items-center justify-center rounded-lg border border-border text-foreground lg:hidden"
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
        <div
          id="site-mobile-menu"
          className="border-t border-border bg-background lg:hidden"
        >
          <nav
            aria-label="Main"
            className="mx-auto flex w-full max-w-6xl flex-col px-4 py-2 sm:px-6"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(pathname, link.href) ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center rounded-lg px-2 text-base transition-colors",
                  isActive(pathname, link.href)
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center gap-2 rounded-lg px-2 text-base text-muted-foreground"
            >
              <InstagramIcon className="size-4" />
              Instagram
            </a>
            <a
              href={INSTAGRAM_DM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "default" }),
                "my-3 h-12 w-full",
                "bg-brand text-brand-foreground hover:bg-brand/90",
              )}
            >
              Order on Instagram
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
