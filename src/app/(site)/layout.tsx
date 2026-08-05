import type { ReactNode } from "react";

import { INSTAGRAM_DM_URL, InstagramIcon } from "@/components/site/instagram";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">{children}</main>

      <SiteFooter />

      {/* MASTER-PLAN.md §4: ordering stays one tap away on a phone, where the
          header's Order button is collapsed into the menu. */}
      <a
        href={INSTAGRAM_DM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed inset-x-4 bottom-4 z-40 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-brand-foreground shadow-lg lg:hidden"
      >
        <InstagramIcon className="size-4" />
        Order on Instagram
      </a>
    </>
  );
}
