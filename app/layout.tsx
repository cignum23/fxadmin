// // app/layout.tsx
// "use client"
// import "./globals.css";
// import Sidebar from "@/components/Sidebar";
// import Topbar from "@/components/Topbar";
// import { AuthProvider } from "@/lib/auth-context";
// import { useState } from "react";
// import { usePathname } from "next/navigation";

// export const metadata = {
//   title: "Crypto Monitor",
//   description: "Live crypto price tracking in USD and NGN",
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const pathname = usePathname();
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   return (
//     <html lang="en">
//       {/* ✅ Ensure global background and foreground inherit from CSS variables */}
//       <body className="flex h-screen bg-bg text-foreground font-sans">
//         <Sidebar
//           sidebarOpen={sidebarOpen}
//           closeSidebar={() => setSidebarOpen(false)}
//           pathname={pathname}
//         />

//         {/* ✅ Use variable-based colors instead of hard-coded grays */}
//         <main className="flex-1 flex flex-col bg-surface">
//           <Topbar />

//           {/* ✅ Preserve spacing and scroll behavior but inherit colors */}
//           <div className="p-4 overflow-y-auto ">
//             <AuthProvider>{children}</AuthProvider>
//           </div>
//         </main>
//       </body>
//     </html>
//   );
// }










// app/layout.tsx
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata = {
  title: "Crypto Monitor",
  description: "Live crypto price tracking in USD and NGN",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        {/* AuthProvider MUST be here AND allowed, because this is still a server component */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
