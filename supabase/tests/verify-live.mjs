// T0.3 gate: prove the app can talk to the real Supabase project, and that the
// anon key cannot reach private data. Reads .env.local; prints no secrets.
import { readFileSync } from "node:fs";
import { createClient } from "/Users/von/torisabi/node_modules/@supabase/supabase-js/dist/index.mjs";

const env = Object.fromEntries(
  readFileSync("/Users/von/torisabi/.env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

const anon = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

let failures = 0;
const check = (name, pass, detail = "") => {
  console.log(`${pass ? "PASS" : "FAIL"}: ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures++;
};

// 1. The view is reachable (empty is fine — it proves connectivity + grants).
const view = await anon.from("public_products").select("*").limit(1);
check("anon can query public_products", !view.error, view.error?.message ?? `${view.data.length} rows`);

// 2. Base tables must be unreachable for anon.
for (const table of ["products", "orders", "expenses", "invoices"]) {
  const r = await anon.from(table).select("*").limit(1);
  const denied = Boolean(r.error) || (r.data?.length ?? 0) === 0;
  check(`anon blocked from ${table}`, denied, r.error ? "denied" : "no rows");
}

// 3. Cost price must not be selectable through the view.
const cost = await anon.from("public_products").select("cost_centavos").limit(1);
check("cost_centavos not selectable via view", Boolean(cost.error), cost.error ? "rejected" : "LEAKED");

// 4. Service role must reach the private tables (used by the Hermes endpoint).
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const svcRead = await svc.from("products").select("id").limit(1);
check("service role can read products", !svcRead.error, svcRead.error?.message ?? "ok");

// 5. Storage bucket exists.
const bucket = await svc.storage.getBucket("product-photos");
check("product-photos bucket exists", !bucket.error && bucket.data?.public === true,
  bucket.error?.message ?? `public=${bucket.data?.public}`);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
