import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase keep-alive (MASTER-PLAN.md §7 Crons).
 *
 * A Cloudflare Cron Trigger hits this once a day so the free Supabase project
 * never crosses the 7-day inactivity threshold and pauses. The read goes through
 * the anonymous `public_products` view — least privilege, and it exercises the
 * same path a real visitor uses.
 *
 * Never cached: a cached 200 would keep answering while the database slept.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const checked_at = new Date().toISOString();

  try {
    const supabase = await createClient();
    // head:true fetches the row count only — no rows cross the wire.
    const { error } = await supabase
      .from("public_products")
      .select("id", { count: "exact", head: true })
      .limit(1);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, db: "up", checked_at });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        db: "down",
        error: error instanceof Error ? error.message : "Unknown error",
        checked_at,
      },
      { status: 503 },
    );
  }
}
