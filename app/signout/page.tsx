// app/signout/page.tsx
"use client";

import React, { useEffect } from "react";
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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <p className="mb-2">Signing out…</p>
      </div>
    </main>
  );
}
