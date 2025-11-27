// app/forgot-password/page.tsx
"use client";

import React, { useState, FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const { resetPassword, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    router.replace("/");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    setLoading(true);
    try {
      // Our resetPassword in auth-context uses resetPasswordForEmail (Supabase)
      const res = await resetPassword(email.trim(), ""); // second param not used by resetPasswordForEmail
      if (!res.success) {
        setError(res.error ?? "Failed to send reset email");
      } else {
        setMessage("If an account with that email exists you’ll receive a password reset email shortly.");
      }
    } catch (err) {
      setError((err as Error)?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-lg p-6 shadow">
        <h1 className="text-2xl font-semibold mb-4">Reset password</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm">Email</span>
            <input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
            />
          </label>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {message && <div className="text-sm text-green-600">{message}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset email"}
            </button>
          </div>

          <div className="text-sm text-center">
            <a href="/login" className="text-blue-600">Back to sign in</a>
          </div>
        </form>
      </div>
    </main>
  );
}
