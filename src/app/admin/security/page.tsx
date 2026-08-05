"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Factor = { id: string; friendly_name?: string; status: string };

/**
 * Authenticator setup. Supabase has no dashboard UI for enrolling TOTP — it has
 * to happen here, signed in as the account itself.
 *
 * Until an authenticator is verified, the RLS policies from migration 0003 let
 * the session read nothing, so this is the first screen a new account sees.
 */
export default function SecurityPage() {
  const router = useRouter();
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadFactors = useCallback(async () => {
    const supabase = createClient();
    const { data, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      setError(listError.message);
      setFactors([]);
      return;
    }
    setFactors((data?.totp ?? []) as Factor[]);
  }, []);

  useEffect(() => {
    void loadFactors();
  }, [loadFactors]);

  async function startEnrolment() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: enrolError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}`,
      });
      if (enrolError) {
        setError(enrolError.message);
        return;
      }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!factorId) return;
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
      setQr(null);
      setSecret(null);
      setFactorId(null);
      await loadFactors();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: unenrolError } = await supabase.auth.mfa.unenroll({
        factorId: id,
      });
      if (unenrolError) setError(unenrolError.message);
      await loadFactors();
    } finally {
      setBusy(false);
    }
  }

  const verified = (factors ?? []).filter((f) => f.status === "verified");

  return (
    <div className="mx-auto w-full max-w-lg p-4 sm:p-6">
      <h1 className="text-xl font-semibold">Two-factor authentication</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        An authenticator app protects the shop&rsquo;s orders, expenses and cost
        prices even if the password is guessed or reused.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {factors === null ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : verified.length > 0 && !qr ? (
        <div className="mt-6 space-y-3">
          <p className="rounded-md border border-sage/40 bg-sage-soft/50 p-3 text-sm">
            Two-factor authentication is <strong>on</strong>. You will be asked
            for a 6-digit code each time you sign in.
          </p>
          {verified.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
            >
              <span className="truncate">
                {f.friendly_name ?? "Authenticator app"}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => remove(f.id)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button onClick={() => router.push("/admin")} className="w-full">
            Go to dashboard
          </Button>
        </div>
      ) : qr ? (
        <form onSubmit={verify} className="mt-6 space-y-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Open your authenticator app (Google Authenticator, 1Password, Authy).</li>
            <li>Scan this QR code.</li>
            <li>Type the 6-digit code it shows.</li>
          </ol>

          <div className="flex justify-center rounded-lg border bg-white p-4">
            {/* Supabase returns the QR as an SVG data URI. */}
            <Image
              src={qr}
              alt="QR code for setting up your authenticator app"
              width={200}
              height={200}
              unoptimized
            />
          </div>

          {secret ? (
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer">
                Can&rsquo;t scan? Enter this code by hand
              </summary>
              <code className="mt-2 block rounded bg-muted p-2 font-mono text-xs break-all">
                {secret}
              </code>
            </details>
          ) : null}

          <div>
            <label htmlFor="code" className="text-sm font-medium">
              6-digit code
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-12 w-full rounded-md border bg-background px-3 text-center font-mono text-lg tracking-[0.4em]"
              placeholder="000000"
            />
          </div>

          <Button
            type="submit"
            className="h-12 w-full"
            disabled={busy || code.length !== 6}
          >
            {busy ? "Checking…" : "Turn on two-factor"}
          </Button>
        </form>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="rounded-md border border-brand/40 bg-brand-soft/50 p-3 text-sm">
            Two-factor authentication is <strong>not set up yet</strong>. Until
            it is, this account cannot load any shop data.
          </p>
          <Button onClick={startEnrolment} disabled={busy} className="h-12 w-full">
            {busy ? "Preparing…" : "Set up authenticator app"}
          </Button>
        </div>
      )}
    </div>
  );
}
