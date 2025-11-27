// app/login/page.tsx
"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type FormState = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ FIX: redirect must happen in useEffect, not during render
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ok = await login(form.email.trim(), form.password);
      if (!ok) {
        setError("Invalid credentials");
      } else {
        router.replace("/");
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
        <h1 className="text-2xl font-semibold mb-4">Sign in</h1>

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

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>

          <div className="text-sm flex justify-between">
            <a href="/signup" className="text-blue-600">Create account</a>
            <a href="/forgot-password" className="text-blue-600">Forgot password?</a>
          </div>
        </form>
      </div>
    </main>
  );
}
