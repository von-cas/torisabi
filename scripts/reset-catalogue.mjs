/**
 * Clears the test catalogue so the shop starts clean, and resets the product
 * code sequence so the first real item is TS-001 again.
 *
 *   node scripts/reset-catalogue.mjs --dry-run   # show what would go
 *   node scripts/reset-catalogue.mjs --confirm   # actually do it
 *
 * Deletes: every product, its photos in storage, and its product_photos rows.
 * Keeps:   expenses (including the real ₱731.01 domain registration), orders,
 *          invoices, and the admin account.
 *
 * Resetting the sequences needs SQL that PostgREST cannot run, so this prints
 * the statement to paste into the Supabase SQL editor afterwards.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

const db = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const confirmed = process.argv.includes("--confirm");

const { data: products, error } = await db
  .from("products")
  .select("id, code, name, status")
  .order("code");
if (error) {
  console.error("Could not read products:", error.message);
  process.exit(1);
}

// Never delete a product that a real order refers to — that would orphan the
// order's product_id. The snapshot columns would survive, but silently losing
// the link is not something a cleanup script should decide.
const { data: linked } = await db
  .from("order_items")
  .select("product_id")
  .not("product_id", "is", null);
const linkedIds = new Set((linked ?? []).map((r) => r.product_id));

const removable = products.filter((p) => !linkedIds.has(p.id));
const kept = products.filter((p) => linkedIds.has(p.id));

console.log(`Products found: ${products.length}`);
for (const p of removable) console.log(`  DELETE  ${p.code}  ${p.status.padEnd(10)} ${p.name}`);
for (const p of kept) console.log(`  KEEP    ${p.code}  (referenced by an order)`);

const { count: expenseCount } = await db
  .from("expenses")
  .select("*", { count: "exact", head: true });
console.log(`\nExpenses kept untouched: ${expenseCount ?? 0}`);

if (!confirmed) {
  console.log("\nDry run. Nothing changed. Re-run with --confirm to apply.");
  process.exit(0);
}

let files = 0;
for (const p of removable) {
  const { data: objects } = await db.storage.from("product-photos").list(p.id);
  if (objects?.length) {
    await db.storage
      .from("product-photos")
      .remove(objects.map((o) => `${p.id}/${o.name}`));
    files += objects.length;
  }
}

if (removable.length) {
  const { error: deleteError } = await db
    .from("products")
    .delete()
    .in("id", removable.map((p) => p.id));
  if (deleteError) {
    console.error("Delete failed:", deleteError.message);
    process.exit(1);
  }
}

const { count: left } = await db
  .from("products")
  .select("*", { count: "exact", head: true });

console.log(`\nDeleted ${removable.length} products and ${files} stored files.`);
console.log(`Products remaining: ${left ?? 0}`);
console.log(
  kept.length
    ? "\nSequence NOT reset: some products were kept, so reusing their codes would collide."
    : `\nNow run this in the Supabase SQL editor so the next product is TS-001:

  alter sequence product_code_seq restart with 1;
`,
);
