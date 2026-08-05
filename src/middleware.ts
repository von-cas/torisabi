import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const CANONICAL_HOST = "www.torisabi.com";
const APEX_HOST = "torisabi.com";

export async function middleware(request: NextRequest) {
  // One canonical hostname: torisabi.com → www.torisabi.com, permanently, with
  // the path and query preserved. Search engines treat the two hosts as one site
  // only if the redirect is a 301. Runs before anything else so redirected
  // requests never touch Supabase.
  const host = request.headers.get("host")?.split(":")[0];
  if (host === APEX_HOST) {
    const url = new URL(request.url);
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 301);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Every path except Next's build output and image files. Public pages need
     * this too: it is what keeps an admin's session alive while she browses the
     * site, and /admin/* is gated inside updateSession().
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
