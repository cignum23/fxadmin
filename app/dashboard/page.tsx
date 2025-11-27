// //app\(root)\dashboard\page.tsx
// "use client"

// import { useEffect } from "react"
// import { useRouter } from "next/navigation"
// import { useAuth } from "@/lib/auth-context"
// import CryptoTable from "@/components/CryptoTable"

// export default function DashboardPage() {
//   const { isAuthenticated, isLoading } = useAuth()
//   const router = useRouter()

//   useEffect(() => {
//     if (!isLoading && !isAuthenticated) {
//       router.push("/")
//     }
//   }, [isAuthenticated, isLoading, router])

//   if (isLoading || !isAuthenticated) {
//     return null
//   }

//   return <CryptoTable />
// }






// //app\(root)\dashboard\page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import CryptoTable from "@/components/CryptoTable";

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) return null;

  return <CryptoTable />;
}
