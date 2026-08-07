import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session refresh + the /admin gate, run on every request by src/middleware.ts.
 *
 * Server Components cannot write cookies, so a refreshed access token would be
 * lost without this: `getUser()` here is what renews the session and writes the
 * new cookies onto the outgoing response.
 */

const LOGIN_PATH = "/admin/login";

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  const from = request.nextUrl.pathname;
  url.pathname = LOGIN_PATH;
  url.search = "";
  if (from !== "/admin") url.searchParams.set("next", from);
  return NextResponse.redirect(url);
}

function redirectToAdmin(request: NextRequest) {
  // `next` must not point back at the login page, or the redirect below would
  // bounce against itself forever.
  const next = request.nextUrl.searchParams.get("next");
  const usable =
    next &&
    next.startsWith("/admin") &&
    !next.startsWith("//") &&
    next !== LOGIN_PATH;
  const url = request.nextUrl.clone();
  url.pathname = usable ? next : "/admin";
  url.search = "";
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const path = request.nextUrl.pathname;
  const onLogin = path === LOGIN_PATH;
  const guarded = path.startsWith("/admin") && !onLogin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase configured there is no session to refresh — and no way to
  // be signed in, so the admin stays closed rather than erroring.
  if (!supabaseUrl || !supabaseKey) {
    return guarded ? redirectToLogin(request) : response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Includes `Cache-Control: private, no-store` — a response that sets auth
        // cookies must never be cached by Cloudflare.
        for (const [name, value] of Object.entries(headers)) {
          response.headers.set(name, value);
        }
      },
    },
  });

  // Nothing may run between creating the client and getUser().
  let signedIn = false;
  try {
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  } catch {
    // Supabase unreachable — treat the caller as signed out instead of 500ing.
    signedIn = false;
  }

  if (guarded && !signedIn) return redirectToLogin(request);

  // An admin who already has a session but opens /admin/login directly — from a
  // bookmark, the address bar, or the home-screen icon — used to be handed the
  // form again. Typing the password there starts a BRAND NEW session at aal1,
  // and that is what demanded a fresh 6-digit code on every single visit. Send
  // her straight through instead. A session that still owes a factor stays on
  // the form, where the code step is waiting for it.
  if (onLogin && signedIn) {
    const { data: aal } = await supabase.auth.mfa
      .getAuthenticatorAssuranceLevel()
      .catch(() => ({ data: null }));
    if (aal && aal.currentLevel === aal.nextLevel) {
      return redirectToAdmin(request);
    }
  }

  return response;
}
