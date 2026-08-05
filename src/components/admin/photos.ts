import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side photo pipeline (MASTER-PLAN.md §7 "Image rule"): every upload is
 * re-drawn onto a canvas and exported as WebP twice — a ~1600px display
 * rendition and a ~400px thumb — so nothing large ever leaves the phone and no
 * server-side image processing is needed.
 */

export const PHOTO_BUCKET = "product-photos";

const DISPLAY_MAX = 1600;
const THUMB_MAX = 400;
const QUALITY = 0.82;
const RETRY_QUALITY = 0.65;
/** Stored files must stay small — 1 GB of free storage is the whole budget. */
const MAX_BYTES = 300 * 1024;

async function toWebp(
  bitmap: ImageBitmap,
  maxDimension: number,
  quality: number,
): Promise<Blob> {
  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot compress images.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (!blob) throw new Error("Could not compress that image.");
  return blob;
}

/** One source file → the two renditions that get stored. */
async function renditions(file: File) {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    let display = await toWebp(bitmap, DISPLAY_MAX, QUALITY);
    if (display.size > MAX_BYTES) {
      display = await toWebp(bitmap, DISPLAY_MAX, RETRY_QUALITY);
    }
    const thumb = await toWebp(bitmap, THUMB_MAX, QUALITY);
    return { display, thumb };
  } finally {
    bitmap.close();
  }
}

/**
 * Compresses, uploads and records each file in order. Throws on the first
 * failure so the caller can show one clear message.
 */
export async function uploadProductPhotos(
  supabase: SupabaseClient,
  productId: string,
  files: File[],
  startOrder: number,
): Promise<void> {
  let sortOrder = startOrder;

  for (const file of files) {
    const { display, thumb } = await renditions(file);
    const base = `${productId}/${crypto.randomUUID()}`;
    const displayPath = `${base}-display.webp`;
    const thumbPath = `${base}-thumb.webp`;

    for (const [path, blob] of [
      [displayPath, display],
      [thumbPath, thumb],
    ] as const) {
      const { error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, blob, { contentType: "image/webp" });
      if (error) throw new Error(error.message);
    }

    const { error } = await supabase.from("product_photos").insert({
      product_id: productId,
      display_path: displayPath,
      thumb_path: thumbPath,
      sort_order: sortOrder,
    });
    if (error) throw new Error(error.message);

    sortOrder += 1;
  }
}
