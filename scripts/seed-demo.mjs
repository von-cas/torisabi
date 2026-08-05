/**
 * Inserts a handful of demo products so the gallery, filters and SOLD state can
 * be checked before real stock exists. Safe to re-run: it deletes its own rows
 * first, and it only ever touches products whose code it created (DEMO-*).
 *
 *   node scripts/seed-demo.mjs          # insert demo products
 *   node scripts/seed-demo.mjs --clean  # remove them again
 *
 * Delete this script once the shop has real products.
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

const DEMO = [
  {
    slug: "demo-woven-rattan-bag",
    name: "Woven Rattan Bag",
    description:
      "Hand-woven rattan with a soft cotton lining and an adjustable strap. Light enough for everyday use, sturdy enough to hold its shape.",
    category: "Bags",
    price_centavos: 185000,
    cost_centavos: 110000,
    variations: ["Natural", "Dark brown"],
    status: "available",
    featured: true,
  },
  {
    slug: "demo-linen-scarf",
    name: "Washed Linen Scarf",
    description:
      "Stonewashed linen that softens with every wash. Long enough to wrap twice.",
    category: "Accessories",
    price_centavos: 89000,
    discounted_price_centavos: 72000,
    cost_centavos: 45000,
    variations: ["Sand", "Sage", "Clay"],
    status: "available",
    featured: true,
  },
  {
    slug: "demo-ceramic-mug-set",
    name: "Ceramic Mug Set of Two",
    description:
      "Speckled stoneware with a matte glaze. Dishwasher and microwave safe.",
    category: "Home",
    price_centavos: 145000,
    cost_centavos: 88000,
    variations: [],
    status: "limited",
    featured: false,
  },
  {
    slug: "demo-vintage-brass-lamp",
    name: "Vintage Brass Table Lamp",
    description:
      "A one-of-a-kind find, already gone to a new home. Kept here so you can see the kind of pieces that come through.",
    category: "Home",
    price_centavos: 320000,
    cost_centavos: 190000,
    variations: [],
    status: "sold_out",
    featured: false,
  },
  {
    slug: "demo-draft-not-public",
    name: "Draft item that must never appear publicly",
    description: "If you can see this on the website, something is wrong.",
    category: "Home",
    price_centavos: 100000,
    cost_centavos: 50000,
    variations: [],
    status: "draft",
    featured: false,
  },
];

const slugs = DEMO.map((d) => d.slug);

// Always clean first so re-running cannot create duplicates.
const { error: delError } = await db.from("products").delete().in("slug", slugs);
if (delError) {
  console.error("Could not clear demo rows:", delError.message);
  process.exit(1);
}

if (process.argv.includes("--clean")) {
  console.log(`Removed ${slugs.length} demo products.`);
  process.exit(0);
}

const { data, error } = await db.from("products").insert(DEMO).select("code, name, status");
if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}

for (const row of data) {
  console.log(`  ${row.code}  ${row.status.padEnd(10)} ${row.name}`);
}
console.log(`\nInserted ${data.length} demo products (1 draft, which must stay invisible publicly).`);
