import Link from "next/link";

import type { GalleryQuery } from "@/components/site/product-filters";
import { cn } from "@/lib/utils";

/**
 * Product search. A plain GET form so it works with or without JavaScript and
 * the result is a shareable, bookmarkable URL. The current filters ride along as
 * hidden fields, so searching narrows the shelf you are already looking at
 * rather than resetting it.
 */
export function SearchBox({ query }: { query: GalleryQuery }) {
  return (
    <form
      action="/products"
      method="get"
      role="search"
      className="flex w-full items-stretch gap-2"
    >
      {query.category && (
        <input type="hidden" name="category" value={query.category} />
      )}
      {query.status && (
        <input type="hidden" name="status" value={query.status} />
      )}
      {query.sort && query.sort !== "newest" && (
        <input type="hidden" name="sort" value={query.sort} />
      )}

      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink/40" />
        <input
          type="search"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Search by name, kind or keyword…"
          aria-label="Search products"
          autoComplete="off"
          // 16px keeps iOS Safari from zooming the page on focus.
          className="h-12 w-full rounded-full border-2 border-ink bg-paper pr-4 pl-10 text-[16px] font-medium text-ink placeholder:text-ink/45 focus:outline-none focus-visible:ring-3 focus-visible:ring-grape/50"
        />
      </div>

      <button
        type="submit"
        style={{ boxShadow: "3px 3px 0 0 var(--magenta)" }}
        className="inline-flex h-12 items-center rounded-full border-2 border-ink bg-ink px-5 text-sm font-bold text-paper transition-transform active:translate-y-px"
      >
        Search
      </button>

      {query.q && (
        <Link
          href="/products"
          aria-label="Clear search"
          className="inline-flex h-12 items-center rounded-full px-3 text-sm font-semibold text-magenta-ink hover:underline"
        >
          Clear
        </Link>
      )}
    </form>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
