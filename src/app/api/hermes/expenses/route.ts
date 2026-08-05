import { NextResponse, type NextRequest } from "next/server";
import { parsePesoToCentavos } from "@/lib/money";
import { createServiceClient } from "@/lib/supabase/service";
import { EXPENSE_CATEGORIES } from "@/lib/types";

/**
 * Receipt → Expense (MASTER-PLAN.md §7, task T2.6).
 *
 * The mirror image of /api/hermes/products: Hermes reads a receipt photo, POSTs
 * the amount it found plus the image, and this route records the expense. Every
 * row lands with `needs_review` set, so a number parsed off a photo is never
 * trusted silently — it sorts to the top of /admin/expenses until the owner
 * confirms it.
 */
export const dynamic = "force-dynamic";

/**
 * Receipts reuse the product-photos bucket. It already exists and is already
 * wired up, and a separate bucket would cost a migration for no gain. They are
 * namespaced under receipts/<expense-id>/ so nothing can collide with a product
 * photo. The bucket is public-read (§7), so the unguessable path is what keeps a
 * receipt private — nothing on the site ever links to one.
 */
const RECEIPT_BUCKET = "product-photos";
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const DEFAULT_CATEGORY = "other";

/**
 * Best-effort rate limit, same as the products route: each isolate gets its own
 * module scope, so the real ceiling is 20/min *per isolate* — enough to stop a
 * runaway Hermes loop, not a substitute for the edge rate-limiting rule on
 * /api/* (§10 Security). Keyed by API key, of which there is exactly one, so the
 * Map cannot grow.
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

/** Today in Manila as YYYY-MM-DD — the server clock runs in UTC. */
function manilaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** A real calendar date in YYYY-MM-DD — rejects 2026-02-30 as well as gibberish. */
function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

/**
 * Hermes guesses the category from what the receipt says, so an unrecognised one
 * is expected rather than exceptional: it lands in "other" and the owner fixes it
 * during the review the row is already flagged for.
 */
function normaliseCategory(raw: string | null): string {
  if (!raw) return DEFAULT_CATEGORY;
  const wanted = raw.toLowerCase();
  return EXPENSE_CATEGORIES.find((category) => category === wanted) ?? DEFAULT_CATEGORY;
}

/** "image/webp" → "webp". Hermes sends WebP; anything odd falls back to it. */
function extensionFor(contentType: string): string {
  const subtype = contentType.split("/")[1]?.split(";")[0]?.toLowerCase() ?? "";
  return /^[a-z0-9]+$/.test(subtype) ? subtype : "webp";
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.HERMES_API_KEY;
    if (!apiKey) {
      console.error("hermes/expenses: HERMES_API_KEY is not set");
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
    const amount = field(form, "amount");
    if (amount === null) {
      return badRequest("`amount` is required — the peso total on the receipt.");
    }

    const amountCentavos = parsePesoToCentavos(amount);
    if (amountCentavos === null) {
      return badRequest(
        `Could not read "${amount}" as a peso amount. Use a plain decimal like 731.01.`,
      );
    }
    if (amountCentavos <= 0) {
      return badRequest("The amount has to be more than ₱0.00.");
    }

    const expenseDate = field(form, "date") ?? manilaToday();
    if (!isIsoDate(expenseDate)) {
      return badRequest(
        `Could not read "${expenseDate}" as a date. Use YYYY-MM-DD, or leave it out for today.`,
      );
    }

    const file = form.get("receipt");
    // An empty part is what a form sends when no file was picked — treat it as
    // "no receipt" rather than as a broken upload.
    const receipt = file instanceof File && file.size > 0 ? file : null;
    if (receipt) {
      if (!receipt.type.startsWith("image/")) {
        return badRequest(
          `"${receipt.name}" is ${receipt.type || "an unknown type"}; only images are accepted.`,
        );
      }
      if (receipt.size > MAX_RECEIPT_BYTES) {
        return badRequest(
          `"${receipt.name}" is larger than 10MB. Resize it on the VPS before uploading.`,
        );
      }
    }

    // --------------------------------------------------------------- write
    const supabase = createServiceClient();
    // Generated here so the storage path and the expense row share an id without
    // a round trip.
    const expenseId = crypto.randomUUID();

    let receiptPath: string | null = null;
    if (receipt) {
      const path = `receipts/${expenseId}/receipt.${extensionFor(receipt.type)}`;
      const { error } = await supabase.storage
        .from(RECEIPT_BUCKET)
        .upload(path, await receipt.arrayBuffer(), {
          contentType: receipt.type,
          upsert: false,
        });

      if (error) {
        console.error("hermes/expenses: receipt upload failed", error);
        return NextResponse.json(
          { error: "Could not store the receipt image." },
          { status: 500 },
        );
      }
      receiptPath = path;
    }

    const { data: expense, error: insertError } = await supabase
      .from("expenses")
      .insert({
        id: expenseId,
        expense_date: expenseDate,
        category: normaliseCategory(field(form, "category")),
        payee: field(form, "payee"),
        description: field(form, "description"),
        amount_centavos: amountCentavos,
        receipt_reference: receiptPath,
        source: "hermes",
        needs_review: true,
      })
      .select(
        "id, expense_date, category, payee, amount_centavos, receipt_reference, needs_review",
      )
      .single();

    if (insertError || !expense) {
      // All or nothing: an orphan image in the bucket would be invisible and
      // impossible to attribute later.
      console.error("hermes/expenses: expense insert failed", insertError);
      if (receiptPath) {
        await supabase.storage.from(RECEIPT_BUCKET).remove([receiptPath]);
      }
      return NextResponse.json(
        { error: "Could not record the expense." },
        { status: 500 },
      );
    }

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    // Logged for observability; the client gets nothing to fingerprint.
    console.error("hermes/expenses: unhandled error", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
