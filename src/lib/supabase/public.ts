import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-free Supabase client for PUBLIC catalogue reads.
 *
 * It carries no session and never calls `next/headers` `cookies()`, so the pages
 * that read through it can be cached (ISR) instead of rendered for every
 * visitor. It reaches only the `public_products` / `public_product_photos`
 * views — the same anon grants the site has always used — and is safe to call
 * inside `unstable_cache`. Never use it for anything that needs the visitor's
 * session; that still goes through `@/lib/supabase/server`.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
