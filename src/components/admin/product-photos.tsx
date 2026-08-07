"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, LoaderCircle, Trash2 } from "lucide-react";
import { revalidatePublicSite } from "@/lib/revalidate-public";
import { createClient } from "@/lib/supabase/client";
import type { ProductPhoto } from "@/lib/types";
import { PHOTO_BUCKET, uploadProductPhotos } from "./photos";

/**
 * Photos of a saved product: add (compressed in the browser first), reorder with
 * the arrows, remove. Arrows rather than drag-and-drop — they work on a phone
 * without a gesture library.
 */

export type AdminPhoto = ProductPhoto & { thumbUrl: string };

export function ProductPhotos({
  productId,
  photos,
}: {
  productId: string;
  photos: AdminPhoto[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(work: (supabase: ReturnType<typeof createClient>) => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await work(createClient());
      await revalidatePublicSite();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something failed.");
    } finally {
      setBusy(false);
    }
  }

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    await run(async (supabase) => {
      await uploadProductPhotos(supabase, productId, selected, photos.length);
    });
    if (fileInput.current) fileInput.current.value = "";
  }

  /** Renumbers every row so duplicate sort_order values (Hermes drafts) settle. */
  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const ordered = [...photos];
    const [moved] = ordered.splice(index, 1);
    ordered.splice(target, 0, moved);

    await run(async (supabase) => {
      for (const [position, photo] of ordered.entries()) {
        if (photo.sort_order === position) continue;
        const { error: updateError } = await supabase
          .from("product_photos")
          .update({ sort_order: position })
          .eq("id", photo.id);
        if (updateError) throw new Error(updateError.message);
      }
    });
  }

  async function remove(photo: AdminPhoto) {
    await run(async (supabase) => {
      await supabase.storage
        .from(PHOTO_BUCKET)
        .remove([photo.display_path, photo.thumb_path]);
      const { error: deleteError } = await supabase
        .from("product_photos")
        .delete()
        .eq("id", photo.id);
      if (deleteError) throw new Error(deleteError.message);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Photos
        </span>
        {busy ? (
          <LoaderCircle className="size-3.5 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              {/* Already a 400px WebP on the Supabase CDN — no optimizer hop. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbUrl}
                alt={photo.alt_text ?? `Photo ${index + 1}`}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <div className="flex items-center justify-between p-1">
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={busy || index === 0}
                    aria-label="Move earlier"
                    className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={busy || index === photos.length - 1}
                    aria-label="Move later"
                    className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(photo)}
                  disabled={busy}
                  aria-label="Remove photo"
                  className="flex size-11 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-30"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No photos yet.</p>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        disabled={busy}
        onChange={(event) => addFiles(event.target.files)}
        className="block w-full text-xs file:mr-2 file:h-11 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:text-xs"
      />
      <p className="text-[11px] text-muted-foreground">
        Add as many as you like — pick several at once, and keep adding whenever
        you want. Each is resized and converted to WebP on this device before it
        uploads.
      </p>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
