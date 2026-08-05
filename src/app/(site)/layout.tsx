import type { ReactNode } from "react";
import Script from "next/script";

import { INSTAGRAM_DM_URL, InstagramIcon } from "@/components/site/instagram";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { BUTTON_PRIMARY, SHADE } from "@/components/site/sticker";
import { cn } from "@/lib/utils";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">{children}</main>

      <SiteFooter />

      {/* Cloudflare Web Analytics (MASTER-PLAN.md §10, task T1.16). Privacy-first,
          cookieless. Loaded only on the public site, never the admin. `afterInteractive`
          so it never delays the first paint. */}
      <Script
        src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon='{"token": "cc423271a0614872bbc1e79d9ba57c92"}'
        strategy="afterInteractive"
      />

      {/* MASTER-PLAN.md §4: ordering stays one tap away on a phone, where the
          header's Order button is collapsed into the menu. */}
      <a
        href={INSTAGRAM_DM_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={SHADE.magenta}
        className={cn(
          BUTTON_PRIMARY,
          "fixed inset-x-4 bottom-4 z-40 text-[0.95rem] lg:hidden",
        )}
      >
        <InstagramIcon className="size-4" />
        Order on Instagram
      </a>
    </>
  );
}
