/**
 * Writes business expense #1 from MASTER-PLAN.md §5 (task T2.3b): the
 * torisabi.com domain registration paid to Cloudflare on 2026-08-05.
 *
 *   node scripts/seed-opening-expense.mjs
 *
 * Idempotent: it matches on receipt reference + amount + date first, so running
 * it twice leaves exactly one row.
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

// ₱731.01 → 73101 centavos. Written as an integer, never parsed from a float.
const OPENING = {
  expense_date: "2026-08-05",
  category: "website and domain",
  payee: "Cloudflare",
  description: "torisabi.com domain registration, 1 year",
  amount_centavos: 73101,
  payment_method: "card",
  receipt_reference: "POS W/D CA CLOUDFLARE SAN FR",
  source: "manual",
  needs_review: false,
};

const COLUMNS =
  "id, expense_date, category, payee, description, amount_centavos, payment_method, receipt_reference";

const { data: existing, error: findError } = await db
  .from("expenses")
  .select(COLUMNS)
  .eq("receipt_reference", OPENING.receipt_reference)
  .eq("amount_centavos", OPENING.amount_centavos)
  .eq("expense_date", OPENING.expense_date);

if (findError) {
  console.error("Could not check for the opening expense:", findError.message);
  process.exit(1);
}

let row = existing?.[0];

if (row) {
  console.log("Opening expense already recorded — nothing inserted.");
} else {
  const { data, error } = await db
    .from("expenses")
    .insert(OPENING)
    .select(COLUMNS)
    .single();
  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }
  row = data;
  console.log("Inserted expense #1.");
}

console.log("");
console.log(`  date              ${row.expense_date}`);
console.log(`  category          ${row.category}`);
console.log(`  payee             ${row.payee}`);
console.log(`  description       ${row.description}`);
console.log(`  payment method    ${row.payment_method}`);
console.log(`  receipt reference ${row.receipt_reference}`);
console.log(
  `  amount_centavos   ${row.amount_centavos}  (${typeof row.amount_centavos}) → ₱${(row.amount_centavos / 100).toFixed(2)}`,
);
console.log("");

if (row.amount_centavos !== 73101) {
  console.error(`Expected 73101 centavos, found ${row.amount_centavos}.`);
  process.exit(1);
}

const { count } = await db
  .from("expenses")
  .select("id", { count: "exact", head: true })
  .eq("receipt_reference", OPENING.receipt_reference);

console.log(`Rows with this receipt reference: ${count} (must be 1).`);
if (count !== 1) process.exit(1);
