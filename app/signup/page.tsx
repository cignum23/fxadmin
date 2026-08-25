// app/signup/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Public self-registration is disabled: this is an internal admin tool with
// no role system, so anyone who could sign up got full rate-setting access.
// Accounts are provisioned by an existing admin via the Supabase dashboard.
export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-card text-center">
        <h1 className="text-2xl font-semibold mb-2">Self-registration is disabled</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Accounts for this admin tool are provisioned by an existing admin. Redirecting to sign in…
        </p>
        <a href="/login" className="text-primary">Go to sign in</a>
      </div>
    </main>
  );
}
