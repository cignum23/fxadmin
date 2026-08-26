"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  // Redirect after auth state resolves so render stays side-effect free.
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
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="auth-card rounded-2xl border border-border bg-white/80 p-6 shadow-card sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <p className="fx-label">FX Admin</p>
            <h1 className="text-2xl font-bold text-[var(--color-text-strong)]">Sign in</h1>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-foreground">Email</span>
            <Input
              type="email"
              value={form.email}
              required
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              className="mt-1 h-11"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-foreground">Password</span>
            <Input
              type="password"
              value={form.password}
              required
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              className="mt-1 h-11"
            />
          </label>

          {error && (
            <div className="rounded-md border border-danger/20 bg-danger/10 p-3 text-sm font-semibold text-danger">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          <div className="flex justify-end text-sm">
            <a href="/forgot-password" className="font-semibold text-foreground underline-offset-4 hover:underline">
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
