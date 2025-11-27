// app/signup/page.tsx
"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type FormState = {
  email: string;
  password: string;
  confirmPassword: string;
};

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated } = useAuth();
  const [form, setForm] = useState<FormState>({ email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (isAuthenticated) {
    // already signed in -> redirect (client-side)
    router.replace("/");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await signup(form.email.trim(), form.password);
      if (!res.success) {
        setError(res.error ?? "Signup failed");
      } else {
        // If Supabase email confirmation required, tell user to check email.
        setSuccessMessage("Signup successful. Check your email to confirm your account (if required). Redirecting…");
        setTimeout(() => router.replace("/"), 1500);
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
        <h1 className="text-2xl font-semibold mb-4">Create an account</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm">Email</span>
            <input
              type="email"
              value={form.email}
              required
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              className="mt-1 block w-full rounded border px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm">Password</span>
            <input
              type="password"
              value={form.password}
              required
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              className="mt-1 block w-full rounded border px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm">Confirm password</span>
            <input
              type="password"
              value={form.confirmPassword}
              required
              onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))}
              className="mt-1 block w-full rounded border px-3 py-2"
            />
          </label>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {successMessage && <div className="text-sm text-green-600">{successMessage}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create account"}
            </button>
          </div>

          <div className="text-sm text-center">
            Already have an account? <a href="/login" className="text-blue-600">Sign in</a>
          </div>
        </form>
      </div>
    </main>
  );
}
