import type { ReactNode } from "react";

import { SHADE, shadeFor } from "@/components/site/sticker";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  lead,
  className,
}: {
  title: string;
  lead?: string;
  className?: string;
}) {
  return (
    <header className={className}>
      <h1 className="font-hand text-4xl leading-[1.05] font-extrabold tracking-tight text-ink sm:text-5xl">
        {title}
      </h1>
      <div aria-hidden="true" className="squiggle mt-3 w-28 text-magenta" />
      {lead && (
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/75">
          {lead}
        </p>
      )}
    </header>
  );
}

/** Shared shell for the text pages (How to Order, Shipping, About, …). */
export function ContentPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <PageHeader title={title} lead={lead} />
      <div className="mt-12 space-y-11">{children}</div>
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      {/* A hand-cut colour tab beside every heading — the sticker language at
          its smallest. The colour is derived from the title, so it is stable. */}
      <h2 className="flex items-center gap-3 font-hand text-2xl font-extrabold text-ink">
        <span
          aria-hidden="true"
          style={shadeFor(title)}
          className="size-3.5 shrink-0 rotate-12 rounded-[4px] border-2 border-ink bg-[var(--shade)]"
        />
        {title}
      </h2>
      <div className="space-y-3 leading-relaxed text-ink/75">{children}</div>
    </section>
  );
}

/** The one thing on a page that must not be skimmed past. */
export function Callout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      style={SHADE.lemon}
      className={cn(
        "sticker rounded-2xl px-5 py-4 font-semibold text-ink",
        className,
      )}
    >
      {children}
    </p>
  );
}
