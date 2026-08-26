// app/forgot-password/page.tsx
"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const { resetPassword, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    setLoading(true);
    try {
      const res = await resetPassword(email.trim());
      if (!res.success) {
        setError(res.error ?? "Failed to send reset email");
      } else {
        setMessage("If an account with that email exists, you will receive a password reset email shortly.");
      }
    } catch (err) {
      setError((err as Error)?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="auth-card rounded-2xl border border-border bg-white/80 p-6 shadow-card sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-sidebar">
            <span className="cignum-mark h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="fx-label">FX Admin</p>
            <h1 className="text-2xl font-bold text-[var(--color-text-strong)]">Reset password</h1>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-foreground">Email</span>
            <Input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-11"
            />
          </label>

          {error && <div className="rounded-md border border-danger/20 bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</div>}
          {message && <div className="rounded-md border border-success/20 bg-success/10 p-3 text-sm font-semibold text-success">{message}</div>}

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Sending..." : "Send reset email"}
            </Button>
          </div>

          <div className="text-center text-sm">
            <a href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">Back to sign in</a>
          </div>
        </form>
      </div>
    </main>
  );
}
