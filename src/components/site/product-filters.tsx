import type { ReactNode } from "react";
import Link from "next/link";

import { PRODUCT_STATUS_LABELS, PUBLIC_STATUSES } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface GalleryQuery {
  category?: string;
  status?: string;
  sort?: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

/** Builds a /products URL that keeps the filters the visitor did not change. */
function buildHref(current: GalleryQuery, patch: GalleryQuery): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  if (next.category) params.set("category", next.category);
  if (next.status) params.set("status", next.status);
  if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border-2 border-ink px-4 text-sm font-semibold transition-colors",
        active
          ? "bg-ink text-paper shadow-[3px_3px_0_0_var(--magenta)]"
          : "bg-paper text-ink hover:bg-magenta-soft",
      )}
    >
      {children}
    </Link>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="text-xs font-bold tracking-[0.16em] text-grape uppercase sm:w-24 sm:shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function ProductFilters({
  categories,
  query,
}: {
  categories: string[];
  query: GalleryQuery;
}) {
  const hasFilters = Boolean(query.category ?? query.status ?? query.sort);

  return (
    <div className="space-y-4">
      {categories.length > 0 && (
        <FilterRow label="Kind">
          <Chip
            href={buildHref(query, { category: undefined })}
            active={!query.category}
          >
            Everything
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category}
              href={buildHref(query, { category })}
              active={query.category === category}
            >
              {category}
            </Chip>
          ))}
        </FilterRow>
      )}

      <FilterRow label="Still here">
        <Chip
          href={buildHref(query, { status: undefined })}
          active={!query.status}
        >
          All
        </Chip>
        {PUBLIC_STATUSES.map((status) => (
          <Chip
            key={status}
            href={buildHref(query, { status })}
            active={query.status === status}
          >
            {PRODUCT_STATUS_LABELS[status]}
          </Chip>
        ))}
      </FilterRow>

      <FilterRow label="Order">
        {SORT_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            href={buildHref(query, { sort: option.value })}
            active={(query.sort ?? "newest") === option.value}
          >
            {option.label}
          </Chip>
        ))}
      </FilterRow>

      {hasFilters && (
        <Link
          href="/products"
          className="inline-flex font-semibold text-magenta-ink hover:underline"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}
