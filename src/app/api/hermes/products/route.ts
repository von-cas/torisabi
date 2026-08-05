import { NextResponse, type NextRequest } from "next/server";
import { parsePesoToCentavos } from "@/lib/money";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Photo → Draft product (MASTER-PLAN.md §7).
 *
 * Hermes resizes on the VPS and POSTs the finished renditions here; this route
 * does no image processing at all (§7 Image rule). Everything it creates lands as
 * a `draft`, which the `public_products` view hides, so a half-filled item can
 * never appear on the site before the owner reviews and publishes it.
 */
export const dynamic = "force-dynamic";

type ServiceClient = ReturnType<typeof createServiceClient>;

const PHOTO_BUCKET = "product-photos";
// A generous ceiling, not a product limit: it only stops a single malformed
// request from trying to stream thousands of files at once. The admin uploader
// has no cap, and a real product never needs this many.
const MAX_PHOTOS = 40;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

/**
 * Best-effort rate limit. Each Workers isolate gets its own module scope, so the
 * real ceiling is 20/min *per isolate* — enough to stop a runaway Hermes loop,
 * not a substitute for the Cloudflare rate-limiting rule on /api/* (§10 Security).
 * Keyed by API key, of which there is exactly one, so the Map cannot grow.
 */
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > RATE_LIMIT) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfter: 0 };
}

/**
 * Constant-time string compare (§10 Security). `===` short-circuits on the first
 * differing byte, which leaks the shared secret one character at a time to anyone
 * who can measure response timing. Length is compared first — that leaks only the
 * key's length — then every remaining byte is XOR-accumulated so the loop always
 * runs to the end regardless of where the mismatch is.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) return false;

  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

function bearerToken(request: NextRequest): string {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Trimmed form field, or null when absent/blank. */
function field(form: FormData, key: string): string | null {
  const value = form.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents left by NFKD
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "item";
}

/** One query for every slug sharing the base, then the first free suffix. */
async function uniqueSlug(
  supabase: ServiceClient,
  base: string,
): Promise<string> {
  const { data } = await supabase
    .from("products")
    .select("slug")
    .like("slug", `${base}%`);

  const taken = new Set<string>((data ?? []).map((row) => row.slug as string));
  if (!taken.has(base)) return base;

  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** "image/webp" → "webp". Hermes sends WebP; anything odd falls back to it. */
function extensionFor(contentType: string): string {
  const subtype = contentType.split("/")[1]?.split(";")[0]?.toLowerCase() ?? "";
  return /^[a-z0-9]+$/.test(subtype) ? subtype : "webp";
}

async function removeUploads(supabase: ServiceClient, paths: string[]) {
  if (paths.length === 0) return;
  await supabase.storage.from(PHOTO_BUCKET).remove(paths);
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.HERMES_API_KEY;
    if (!apiKey) {
      console.error("hermes/products: HERMES_API_KEY is not set");
      return NextResponse.json(
        { error: "Server is not configured for Hermes uploads." },
        { status: 500 },
      );
    }

    if (!timingSafeEqual(bearerToken(request), apiKey)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { allowed, retryAfter } = checkRateLimit(apiKey);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return badRequest("Expected multipart/form-data.");
    }

    // ------------------------------------------------------------- validate
    const photos = form
      .getAll("photos")
      .filter((entry): entry is File => entry instanceof File);

    if (photos.length === 0) {
      return badRequest("At least one `photos` file is required.");
    }
    if (photos.length > MAX_PHOTOS) {
      return badRequest(`At most ${MAX_PHOTOS} photos per request.`);
    }
    for (const photo of photos) {
      if (!photo.type.startsWith("image/")) {
        return badRequest(
          `"${photo.name}" is ${photo.type || "an unknown type"}; only images are accepted.`,
        );
      }
      if (photo.size > MAX_PHOTO_BYTES) {
        return badRequest(
          `"${photo.name}" is larger than 10MB. Resize it on the VPS before uploading.`,
        );
      }
    }

    const name = field(form, "name");
    const category = field(form, "category");
    const description = field(form, "description");
    const price = field(form, "price");

    let priceCentavos = 0;
    if (price !== null) {
      const parsed = parsePesoToCentavos(price);
      if (parsed === null) {
        return badRequest(
          `Could not read "${price}" as a peso amount. Use a plain decimal like 1250.50.`,
        );
      }
      priceCentavos = parsed;
    }

    // --------------------------------------------------------------- write
    const supabase = createServiceClient();
    // Generated here so the storage paths and the product row share an id
    // without a round trip.
    const productId = crypto.randomUUID();

    const uploaded: string[] = [];
    for (const [index, photo] of photos.entries()) {
      const path = `products/${productId}/${index}-display.${extensionFor(photo.type)}`;
      const { error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, await photo.arrayBuffer(), {
          contentType: photo.type,
          upsert: false,
        });

      if (error) {
        console.error("hermes/products: photo upload failed", error);
        await removeUploads(supabase, uploaded);
        return NextResponse.json(
          { error: "Could not store the photos." },
          { status: 500 },
        );
      }
      uploaded.push(path);
    }

    // `code` is left to the database default ('TS-' || nextval(...)) so concurrent
    // uploads can never collide on it. The slug needs a value up front, so when
    // Hermes sends no name it is rewritten from the generated code below.
    const slug = name
      ? await uniqueSlug(supabase, slugify(name))
      : `draft-${productId.slice(0, 8)}`;

    const { data: product, error: insertError } = await supabase
      .from("products")
      .insert({
        id: productId,
        name: name ?? "Untitled draft",
        slug,
        description,
        category,
        price_centavos: priceCentavos,
        status: "draft",
        source: "hermes",
      })
      .select("id, code, slug, status")
      .single();

    if (insertError || !product) {
      console.error("hermes/products: product insert failed", insertError);
      await removeUploads(supabase, uploaded);
      return NextResponse.json(
        { error: "Could not create the draft product." },
        { status: 500 },
      );
    }

    const { error: photoError } = await supabase.from("product_photos").insert(
      uploaded.map((path, index) => ({
        product_id: productId,
        // Hermes posts one rendition per photo, so display and thumb share a path.
        display_path: path,
        thumb_path: path,
        sort_order: index,
      })),
    );

    if (photoError) {
      // Roll back rather than leave a photo-less draft for the owner to puzzle over.
      console.error("hermes/products: photo rows failed", photoError);
      await supabase.from("products").delete().eq("id", productId);
      await removeUploads(supabase, uploaded);
      return NextResponse.json(
        { error: "Could not link the photos to the product." },
        { status: 500 },
      );
    }

    // With no name to slugify, the row went in under a placeholder slug; now that
    // the database has generated the code, rewrite it to something like "ts-001".
    let finalSlug = product.slug as string;
    if (!name) {
      const codeSlug = await uniqueSlug(supabase, slugify(product.code as string));
      const { error: slugError } = await supabase
        .from("products")
        .update({ slug: codeSlug })
        .eq("id", productId);

      // Cosmetic only — the draft is already usable, so report what is stored
      // rather than failing the upload.
      if (slugError) {
        console.error("hermes/products: slug rewrite failed", slugError);
      } else {
        finalSlug = codeSlug;
      }
    }

    return NextResponse.json(
      {
        id: product.id,
        code: product.code,
        slug: finalSlug,
        status: product.status,
        photo_count: uploaded.length,
      },
      { status: 201 },
    );
  } catch (error) {
    // Logged for Workers observability; the client gets nothing to fingerprint.
    console.error("hermes/products: unhandled error", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
