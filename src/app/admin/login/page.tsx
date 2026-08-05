"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Admin sign-in. Both accounts have TOTP enrolled (MASTER-PLAN.md §10), so the
 * password step usually leaves the session at aal1 with aal2 required — the
 * 6-digit step below is what completes it. There is no signup link anywhere:
 * public signups are disabled in Supabase.
 */

const INPUT =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30";

function message(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [needsCode, setNeedsCode] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function finish() {
    const next = new URLSearchParams(window.location.search).get("next");
    const safe = next && next.startsWith("/admin") && !next.startsWith("//");
    router.replace(safe ? next : "/admin");
    router.refresh();
  }

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }

      const { data: aal, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) {
        setError(aalError.message);
        return;
      }

      const needsSecondFactor =
        aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel;

      if (!needsSecondFactor) {
        finish();
        return;
      }

      const { data: factors, error: factorError } =
        await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (factorError || !totp) {
        setError(
          factorError?.message ??
            "This account needs an authenticator app, but no verified factor was found.",
        );
        return;
      }

      setFactorId(totp.id);
      setNeedsCode(true);
    } catch (caught) {
      setError(message(caught, "Could not reach the sign-in service."));
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.trim(),
      });
      if (verifyError) {
        setError(verifyError.message);
        setCode("");
        return;
      }
      finish();
    } catch (caught) {
      setError(message(caught, "Could not verify that code."));
    } finally {
      setBusy(false);
    }
  }

  async function startOver() {
    setNeedsCode(false);
    setCode("");
    setError(null);
    try {
      await createClient().auth.signOut();
    } catch {
      // Nothing to sign out of; the form is reset either way.
    }
  }

  return (
    <div className="flex min-h-svh flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-lg font-semibold tracking-tight">Torisabi admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {needsCode
            ? "Enter the 6-digit code from your authenticator app."
            : "Sign in to manage products, orders and expenses."}
        </p>

        {needsCode ? (
          <form onSubmit={submitCode} className="mt-5 space-y-3">
            <div>
              <label
                htmlFor="code"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Authentication code
              </label>
              <input
                id="code"
                name="one-time-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ""))
                }
                className={`${INPUT} text-center text-lg tracking-[0.4em]`}
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Verify and continue
            </button>

            <button
              type="button"
              onClick={startOver}
              className="h-11 w-full rounded-md text-sm text-muted-foreground hover:text-foreground"
            >
              Use a different account
            </button>
          </form>
        ) : (
          <form onSubmit={submitPassword} className="mt-5 space-y-3">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={INPUT}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={INPUT}
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
