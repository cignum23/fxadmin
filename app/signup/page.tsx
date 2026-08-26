"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";

// Public self-registration stays disabled because this internal admin tool has
// sensitive rate-setting capabilities and no public role onboarding workflow.
export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="auth-card rounded-2xl border border-border bg-white/80 p-6 text-center shadow-card sm:p-8">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-lg bg-primary">
          <TrendingUp className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-[var(--color-text-strong)]">Self-registration is disabled</h1>
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          Accounts for this admin tool are provisioned by an existing admin. Redirecting to sign in...
        </p>
        <a href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">Go to sign in</a>
      </div>
    </main>
  );
}
