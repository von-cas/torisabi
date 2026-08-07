import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { CATALOGUE_TAG } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin-only: refresh the cached public catalogue after a product or photo
 * change. The admin dashboard calls this from the browser after each write, so
 * edits appear on the public site immediately instead of waiting for the hourly
 * ISR backstop.
 *
 * Auth is the visitor's Supabase session: only a signed-in owner may purge. The
 * auth cookie is SameSite=Lax, so a cross-site request carries no session and is
 * rejected — the purge cannot be triggered from another origin.
 */
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Second arg is the cache-life profile: "max" invalidates immediately.
  revalidateTag(CATALOGUE_TAG, "max");
  return NextResponse.json({ ok: true });
}
