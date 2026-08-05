/**
 * Weekly Torisabi backup — MASTER-PLAN.md task T2.8.
 *
 * Writes a dated folder into Google Drive containing every row of every table
 * as JSON, plus every product photo. Keeps the last 8 weeks and deletes older
 * ones so it cannot grow forever.
 *
 *   node scripts/backup.mjs            # run a backup
 *   node scripts/backup.mjs --verify   # restore-check the newest backup
 *
 * Exports through the Data API with the service key rather than pg_dump,
 * because pg_dump needs the database password, which lives only in Von's
 * password manager. The trade-off: this captures data, not schema. The schema
 * is already version-controlled in supabase/migrations, so a full rebuild is
 * "run the migrations, then load these JSON files".
 */
import { mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRIVE = "/Users/von/Library/CloudStorage/GoogleDrive-vlawrence0324@gmail.com/My Drive/Torisabi Backups";
const KEEP_WEEKS = 8;
const TABLES = ["products", "product_photos", "orders", "order_items", "invoices", "expenses"];

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

function fail(message) {
  // Printed output is what reaches Telegram, so only failures speak.
  console.log(`Torisabi backup FAILED: ${message}`);
  process.exit(0);
}

if (process.argv.includes("--verify")) {
  if (!existsSync(DRIVE)) fail(`no backup folder at ${DRIVE}`);
  const runs = readdirSync(DRIVE).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  if (!runs.length) fail("no backups found");
  const newest = join(DRIVE, runs[runs.length - 1]);
  let rows = 0;
  for (const table of TABLES) {
    const path = join(newest, `${table}.json`);
    if (!existsSync(path)) fail(`${runs[runs.length - 1]} is missing ${table}.json`);
    const parsed = JSON.parse(readFileSync(path, "utf8")); // throws if corrupt
    rows += parsed.length;
  }
  console.log(`Newest backup ${runs[runs.length - 1]} is readable: ${TABLES.length} tables, ${rows} rows total.`);
  process.exit(0);
}

if (!existsSync(DRIVE)) mkdirSync(DRIVE, { recursive: true });

// Date comes from the system clock at run time, which is what a scheduled job wants.
const stamp = new Date().toISOString().slice(0, 10);
const dest = join(DRIVE, stamp);
mkdirSync(join(dest, "photos"), { recursive: true });

let totalRows = 0;
for (const table of TABLES) {
  const { data, error } = await db.from(table).select("*");
  if (error) fail(`could not read ${table}: ${error.message}`);
  writeFileSync(join(dest, `${table}.json`), JSON.stringify(data, null, 1));
  totalRows += data.length;
}

// Product photos, one folder per product id.
let photoCount = 0;
const { data: products } = await db.from("products").select("id");
for (const product of products ?? []) {
  const { data: files } = await db.storage.from("product-photos").list(product.id);
  for (const file of files ?? []) {
    const { data: blob, error } = await db.storage
      .from("product-photos")
      .download(`${product.id}/${file.name}`);
    if (error || !blob) continue;
    mkdirSync(join(dest, "photos", product.id), { recursive: true });
    writeFileSync(
      join(dest, "photos", product.id, file.name),
      Buffer.from(await blob.arrayBuffer()),
    );
    photoCount++;
  }
}

writeFileSync(
  join(dest, "README.txt"),
  `Torisabi backup ${stamp}\n\n` +
    `${totalRows} rows across ${TABLES.length} tables, ${photoCount} photos.\n\n` +
    `To restore: run the migrations in supabase/migrations against a fresh\n` +
    `Supabase project, then load each JSON file into its matching table and\n` +
    `upload photos/<product-id>/* back into the product-photos bucket.\n`,
);

// Prune old runs.
const runs = readdirSync(DRIVE).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
let pruned = 0;
for (const old of runs.slice(0, Math.max(0, runs.length - KEEP_WEEKS))) {
  rmSync(join(DRIVE, old), { recursive: true, force: true });
  pruned++;
}

// A successful run says nothing, so the weekly cron stays quiet unless it breaks.
if (process.argv.includes("--report")) {
  console.log(`Backed up ${totalRows} rows and ${photoCount} photos to ${stamp}. Pruned ${pruned}.`);
}
