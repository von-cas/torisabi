import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses Row Level Security, so it must only ever be
 * constructed inside a route handler that has already authenticated the caller —
 * currently just the Hermes endpoints, which check HERMES_API_KEY first.
 * Never import this from a Client Component.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
