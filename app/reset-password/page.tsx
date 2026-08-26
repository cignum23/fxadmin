"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const supabase = createSupabaseBrowserClient();

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setReady(!!data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setReady(!!session);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Password updated. You can sign in with your new password.");
    await supabase.auth.signOut();
    setTimeout(() => router.replace("/login"), 1200);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="auth-card rounded-2xl border border-border bg-white/85 p-6 shadow-card sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-sidebar">
            <span className="cignum-mark h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="fx-label">FX Admin</p>
            <h1 className="text-2xl font-bold text-[var(--color-text-strong)]">Set new password</h1>
          </div>
        </div>

        {!ready && (
          <div className="rounded-lg border border-warning/25 bg-warning/10 p-4 text-sm font-semibold text-foreground">
            Open this page from the password reset email link to continue.
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-foreground">New password</span>
            <Input
              type="password"
              value={password}
              required
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 h-11"
              disabled={!ready || loading}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-foreground">Confirm password</span>
            <Input
              type="password"
              value={confirmPassword}
              required
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1 h-11"
              disabled={!ready || loading}
            />
          </label>

          {error && <div className="rounded-md border border-danger/20 bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</div>}
          {message && <div className="rounded-md border border-success/20 bg-success/10 p-3 text-sm font-semibold text-success">{message}</div>}

          <Button type="submit" disabled={!ready || loading} className="w-full">
            {loading ? "Updating..." : "Update password"}
          </Button>

          <div className="text-center text-sm">
            <Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
