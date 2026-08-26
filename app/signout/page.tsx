"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function SignOutPage() {
  const { signout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await signout();
      } finally {
        router.replace("/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="rounded-2xl border border-border bg-white/80 p-6 text-center shadow-card">
        <p className="mb-2 font-semibold text-[var(--color-text-strong)]">Signing out...</p>
      </div>
    </main>
  );
}
