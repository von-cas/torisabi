"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { formatPeso } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_STATUS_LABELS, type ProductStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Dense product list (MASTER-PLAN.md §5): a tight table on desktop, two-line
 * cards on phones. Status is an inline dropdown that saves the moment it
 * changes — marking something Sold takes one tap.
 *
 * Drafts are the Hermes review queue: photo-to-draft products land here, and the
 * Drafts filter is how they get found.
 */

export interface AdminProductRow {
  id: string;
  code: string;
  name: string;
  category: string | null;
  price_centavos: number;
  discounted_price_centavos: number | null;
  status: ProductStatus;
  created_at: string;
  thumbUrl: string | null;
}

type Sort = "newest" | "name" | "price";

const STATUSES = Object.keys(PRODUCT_STATUS_LABELS) as ProductStatus[];

const SELECT =
  "h-11 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-ring md:h-8";

function price(row: AdminProductRow) {
  return formatPeso(
    Number(row.discounted_price_centavos ?? row.price_centavos ?? 0),
  );
}

export function ProductTable({
  products,
  loadError,
  initialFilter,
}: {
  products: AdminProductRow[];
  loadError: string | null;
  initialFilter: "all" | "draft";
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "draft">(initialFilter);
  const [sort, setSort] = useState<Sort>("newest");
  const [pending, setPending] = useState<Record<string, ProductStatus>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const statusOf = (row: AdminProductRow) => pending[row.id] ?? row.status;
  const draftCount = products.filter((row) => statusOf(row) === "draft").length;

  const visible = products
    .filter((row) => (filter === "draft" ? statusOf(row) === "draft" : true))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price") return b.price_centavos - a.price_centavos;
      return b.created_at.localeCompare(a.created_at);
    });

  async function changeStatus(row: AdminProductRow, status: ProductStatus) {
    setSavingId(row.id);
    setSaveError(null);
    setPending((current) => ({ ...current, [row.id]: status }));
    try {
      const { error } = await createClient()
        .from("products")
        .update({ status })
        .eq("id", row.id);
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (caught) {
      setPending((current) => {
        const next = { ...current };
        delete next[row.id];
        return next;
      });
      setSaveError(
        caught instanceof Error ? caught.message : "Could not save that status.",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-base font-semibold tracking-tight">
          Products
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {products.length}
          </span>
        </h1>

        <div className="flex overflow-hidden rounded-md border border-border">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "h-11 px-3 text-xs md:h-8",
              filter === "all" ? "bg-muted font-medium" : "text-muted-foreground",
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("draft")}
            className={cn(
              "h-11 border-l border-border px-3 text-xs md:h-8",
              filter === "draft"
                ? "bg-muted font-medium"
                : "text-muted-foreground",
            )}
          >
            Drafts to review {draftCount}
          </button>
        </div>

        <label className="sr-only" htmlFor="sort">
          Sort
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(event) => setSort(event.target.value as Sort)}
          className={SELECT}
        >
          <option value="newest">Newest</option>
          <option value="name">Name</option>
          <option value="price">Highest price</option>
        </select>

        <Link
          href="/admin/products/new"
          className="hidden h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground md:inline-flex"
        >
          + New product
        </Link>
      </div>

      {loadError ? (
        <p className="rounded-lg border border-border bg-muted/50 p-2.5 text-xs text-muted-foreground">
          Could not load products: {loadError}
        </p>
      ) : null}
      {saveError ? (
        <p className="rounded-lg border border-destructive/40 p-2.5 text-xs text-destructive">
          {saveError}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          {filter === "draft"
            ? "No drafts waiting for review."
            : "No products yet."}{" "}
          <Link href="/admin/products/new" className="underline">
            Add one
          </Link>
          .
        </p>
      ) : (
        <>
          <table className="hidden w-full border-separate border-spacing-0 text-sm md:table">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="sticky top-0 w-12 border-b border-border bg-background py-1.5 pr-2 font-medium">
                  <span className="sr-only">Photo</span>
                </th>
                <th className="sticky top-0 w-20 border-b border-border bg-background py-1.5 pr-2 font-medium">
                  Code
                </th>
                <th className="sticky top-0 border-b border-border bg-background py-1.5 pr-2 font-medium">
                  Name
                </th>
                <th className="sticky top-0 w-28 border-b border-border bg-background py-1.5 pr-2 text-right font-medium">
                  Price
                </th>
                <th className="sticky top-0 w-40 border-b border-border bg-background py-1.5 pr-2 font-medium">
                  Status
                </th>
                <th className="sticky top-0 w-16 border-b border-border bg-background py-1.5 font-medium">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="hover:bg-muted/50">
                  <td className="border-b border-border py-1 pr-2">
                    <Thumb url={row.thumbUrl} name={row.name} />
                  </td>
                  <td className="border-b border-border py-1 pr-2 font-mono text-xs text-muted-foreground">
                    {row.code}
                  </td>
                  <td className="max-w-0 border-b border-border py-1 pr-2">
                    <div className="truncate">{row.name}</div>
                    {row.category ? (
                      <div className="truncate text-xs text-muted-foreground">
                        {row.category}
                      </div>
                    ) : null}
                  </td>
                  <td className="border-b border-border py-1 pr-2 text-right tabular-nums">
                    {price(row)}
                  </td>
                  <td className="border-b border-border py-1 pr-2">
                    <select
                      aria-label={`Status of ${row.name}`}
                      value={statusOf(row)}
                      disabled={savingId === row.id}
                      onChange={(event) =>
                        changeStatus(row, event.target.value as ProductStatus)
                      }
                      className={SELECT}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {PRODUCT_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border-b border-border py-1">
                    <Link
                      href={`/admin/products/${row.id}`}
                      className="text-xs underline underline-offset-2"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="space-y-2 md:hidden">
            {visible.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2"
              >
                <Thumb url={row.thumbUrl} name={row.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link
                      href={`/admin/products/${row.id}`}
                      className="truncate text-sm font-medium"
                    >
                      {row.name}
                    </Link>
                    <span className="shrink-0 text-sm tabular-nums">
                      {price(row)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {row.code}
                    </span>
                    <select
                      aria-label={`Status of ${row.name}`}
                      value={statusOf(row)}
                      disabled={savingId === row.id}
                      onChange={(event) =>
                        changeStatus(row, event.target.value as ProductStatus)
                      }
                      className={SELECT}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {PRODUCT_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Link
        href="/admin/products/new"
        aria-label="New product"
        className="fixed bottom-20 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  );
}

function Thumb({ url, name }: { url: string | null; name: string }) {
  if (!url) {
    return (
      <div className="size-10 shrink-0 rounded-md border border-border bg-muted" />
    );
  }
  return (
    // Supabase already serves a 400px WebP thumb from its CDN; the optimizer
    // would only add a hop, and admin photos are never public traffic.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      width={40}
      height={40}
      loading="lazy"
      className="size-10 shrink-0 rounded-md border border-border object-cover"
    />
  );
}
