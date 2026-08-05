"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { centavosToInput, parsePesoToCentavos } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";
import {
  PRODUCT_STATUS_LABELS,
  type AdminProduct,
  type ProductStatus,
} from "@/lib/types";
import { uploadProductPhotos } from "./photos";
import { ProductPhotos, type AdminPhoto } from "./product-photos";

/**
 * Create/edit a product. The product code comes from the database sequence, so
 * it is never sent from here; the slug is derived from the name and only set at
 * creation time — changing it later would break a live URL.
 */

const FIELD =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30";
const LABEL = "mb-1 block text-xs font-medium text-muted-foreground";

const STATUSES = Object.keys(PRODUCT_STATUS_LABELS) as ProductStatus[];

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "product";
}

function suffix() {
  return Math.random().toString(36).slice(2, 6);
}

export function ProductForm({
  product,
  photos = [],
}: {
  product?: AdminProduct;
  photos?: AdminPhoto[];
}) {
  const router = useRouter();
  const editing = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [price, setPrice] = useState(
    product ? centavosToInput(product.price_centavos) : "",
  );
  const [discounted, setDiscounted] = useState(
    centavosToInput(product?.discounted_price_centavos),
  );
  const [cost, setCost] = useState(centavosToInput(product?.cost_centavos));
  const [variations, setVariations] = useState(
    (product?.variations ?? []).join(", "),
  );
  const [status, setStatus] = useState<ProductStatus>(
    product?.status ?? "draft",
  );
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [files, setFiles] = useState<File[]>([]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function fields() {
    const priceCentavos = parsePesoToCentavos(price);
    if (priceCentavos === null) throw new Error("Enter a price, like 1250.00");

    const discountedCentavos = discounted.trim()
      ? parsePesoToCentavos(discounted)
      : null;
    if (discounted.trim() && discountedCentavos === null) {
      throw new Error("The discounted price is not a valid amount.");
    }
    if (discountedCentavos !== null && discountedCentavos > priceCentavos) {
      throw new Error("The discounted price cannot be higher than the price.");
    }

    const costCentavos = cost.trim() ? parsePesoToCentavos(cost) : null;
    if (cost.trim() && costCentavos === null) {
      throw new Error("The cost price is not a valid amount.");
    }

    return {
      name: name.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      price_centavos: priceCentavos,
      discounted_price_centavos: discountedCentavos,
      cost_centavos: costCentavos,
      variations: variations
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      status,
      featured,
    };
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const payload = fields();
      const supabase = createClient();

      if (product) {
        const { error: updateError } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id);
        if (updateError) throw new Error(updateError.message);
        setSaved(true);
        router.refresh();
        return;
      }

      // Slugs are unique in the database; on a clash, try again with a short
      // random suffix rather than making the owner rename the product.
      const base = slugify(payload.name);
      let id: string | null = null;
      for (let attempt = 0; attempt < 3 && !id; attempt += 1) {
        const slug = attempt === 0 ? base : `${base}-${suffix()}`;
        const { data, error: insertError } = await supabase
          .from("products")
          .insert({ ...payload, slug })
          .select("id")
          .single();
        if (!insertError) {
          id = (data as { id: string }).id;
          break;
        }
        if (insertError.code !== "23505") throw new Error(insertError.message);
      }
      if (!id) {
        throw new Error(
          "Could not find a free web address for that name — try a slightly different name.",
        );
      }

      if (files.length > 0) {
        setCreatedId(id);
        await uploadProductPhotos(supabase, id, files, 0);
      }

      router.push("/admin/products");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    if (!product) return;
    setBusy(true);
    setError(null);
    try {
      const { error: archiveError } = await createClient()
        .from("products")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", product.id);
      if (archiveError) throw new Error(archiveError.message);
      router.push("/admin/products");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not archive this.",
      );
      setBusy(false);
    }
  }

  /**
   * Permanent delete. Removes the stored photos first, then the row — the
   * product_photos rows go with it via ON DELETE CASCADE. Orders that referenced
   * this product keep their own snapshot of the name, code and price, so past
   * sales and profit figures are unaffected.
   */
  async function destroy() {
    if (!product) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: files } = await supabase.storage
        .from("product-photos")
        .list(product.id);
      if (files?.length) {
        await supabase.storage
          .from("product-photos")
          .remove(files.map((f) => `${product.id}/${f.name}`));
      }
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);
      if (deleteError) throw new Error(deleteError.message);
      router.push("/admin/products");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not delete this.",
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-base font-semibold tracking-tight">
          {editing ? `Edit ${product?.code}` : "New product"}
        </h1>
        <Link
          href="/admin/products"
          className="flex h-11 items-center rounded-md border border-border px-3 text-sm md:h-9"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={busy}
          className="flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50 md:h-9"
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {editing ? "Save" : "Create product"}
        </button>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={FIELD}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="category">
            Category
          </label>
          <input
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={FIELD}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="variations">
            Variations
          </label>
          <input
            id="variations"
            placeholder="Beige, Brown, Small, Large"
            value={variations}
            onChange={(event) => setVariations(event.target.value)}
            className={FIELD}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Separate with commas.
          </p>
        </div>

        <div>
          <label className={LABEL} htmlFor="price">
            Price ₱
          </label>
          <input
            id="price"
            inputMode="decimal"
            required
            placeholder="1250.00"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={FIELD}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="discounted">
            Discounted price ₱
          </label>
          <input
            id="discounted"
            inputMode="decimal"
            placeholder="Optional"
            value={discounted}
            onChange={(event) => setDiscounted(event.target.value)}
            className={FIELD}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="cost">
            Cost price ₱ — private
          </label>
          <input
            id="cost"
            inputMode="decimal"
            placeholder="What you paid for it"
            value={cost}
            onChange={(event) => setCost(event.target.value)}
            className={FIELD}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Never shown on the website. Used only for profit reports.
          </p>
        </div>

        <div>
          <label className={LABEL} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as ProductStatus)}
            className={FIELD}
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {PRODUCT_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Drafts stay off the website until you publish them.
          </p>
        </div>

        <div className="flex items-end">
          <label className="flex h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
              className="size-4"
            />
            Featured on the home page
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        {product ? (
          <ProductPhotos productId={product.id} photos={photos} />
        ) : (
          <div className="space-y-2">
            <span className="block text-xs font-medium text-muted-foreground">
              Photos
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                setFiles(Array.from(event.target.files ?? []))
              }
              className="block w-full text-xs file:mr-2 file:h-11 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              {files.length > 0
                ? `${files.length} photo${files.length === 1 ? "" : "s"} ready — they upload once the product is created. Pick more to add them.`
                : "Add as many as you like — pick several at once. Each is compressed to WebP on this device before uploading, and you can add more after saving."}
            </p>
          </div>
        )}
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/40 p-2.5 text-sm text-destructive">
          {error}
          {createdId ? (
            <>
              {" "}
              <Link href={`/admin/products/${createdId}`} className="underline">
                Open the product and try the photos again
              </Link>
              .
            </>
          ) : null}
        </p>
      ) : null}

      {saved ? <p className="text-sm text-muted-foreground">Saved.</p> : null}

      {product ? (
        <div className="flex items-center gap-2 border-t border-border pt-3">
          {confirmArchive ? (
            <>
              <button
                type="button"
                onClick={archive}
                disabled={busy}
                className="h-11 rounded-md bg-destructive/10 px-3 text-sm text-destructive disabled:opacity-50 md:h-9"
              >
                Confirm archive
              </button>
              <button
                type="button"
                onClick={() => setConfirmArchive(false)}
                className="h-11 px-2 text-sm text-muted-foreground md:h-9"
              >
                Keep it
              </button>
            </>
          ) : confirmDelete ? (
            <>
              <button
                type="button"
                onClick={destroy}
                disabled={busy}
                className="h-11 rounded-md bg-destructive px-3 text-sm font-medium text-white disabled:opacity-50 md:h-9"
              >
                Yes, delete {product.code} forever
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-11 px-2 text-sm text-muted-foreground md:h-9"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setConfirmArchive(true)}
                className="h-11 rounded-md border border-border px-3 text-sm text-muted-foreground md:h-9"
              >
                Archive
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="h-11 rounded-md px-3 text-sm text-destructive hover:bg-destructive/10 md:h-9"
              >
                Delete
              </button>
            </>
          )}
          <span className="text-[11px] text-muted-foreground">
            {confirmDelete
              ? "This removes the product and its photos permanently. Past orders keep their own record."
              : "Archive hides it and keeps it. Delete removes it for good."}
          </span>
        </div>
      ) : null}
    </form>
  );
}
