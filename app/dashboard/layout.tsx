// //app\(root)\dashboard\layout.tsx
// "use client"

// import { type ReactNode, useState } from "react"
// import { usePathname } from "next/navigation"
// import { cn } from "@/lib/utils"
// import { TrendingUp, Menu, Search } from "lucide-react"
// import Sidebar from "@/components/Sidebar"     // ← your existing Sidebar
// import { Input } from "@/components/ui/input"

// interface DashboardLayoutProps {
//   children: ReactNode
// }

// export default function DashboardLayout({ children }: DashboardLayoutProps) {
//   const pathname = usePathname()
//   const [sidebarOpen, setSidebarOpen] = useState(false)

//   return (
//     <div className="min-h-screen bg-background">

//       {/* Mobile Header */}
//       <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-sidebar border-b border-border flex items-center justify-between px-4">
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
//           >
//             <Menu className="w-5 h-5" />
//           </button>

//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
//               <TrendingUp className="w-4 h-4 text-primary-foreground" />
//             </div>
//             <span className="font-semibold">Crypto Monitor</span>
//           </div>
//         </div>
//       </header>

//       {/* Mobile Overlay */}
//       {sidebarOpen && (
//         <div
//           className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Sidebar (your existing component) */}
//       <Sidebar
//         sidebarOpen={sidebarOpen}
//         closeSidebar={() => setSidebarOpen(false)}
//         pathname={pathname}
//       />

//       {/* Main Content */}
//       <main className="lg:pl-72 pt-16 lg:pt-0">

//         {/* Top Bar */}
//         <div className="sticky top-0 z-40 h-16 bg-background/95 backdrop-blur border-b border-border hidden lg:flex items-center justify-between px-8">
//           <div className="relative w-80">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//             <Input placeholder="Search..." className="pl-10 bg-card border-border" />
//           </div>

//           <div className="flex items-center gap-4">
//             <span className="text-sm text-muted-foreground">
//               {new Date().toLocaleDateString("en-US", {
//                 weekday: "long",
//                 year: "numeric",
//                 month: "long",
//                 day: "numeric",
//               })}
//             </span>
//           </div>
//         </div>

//         {/* Page Content */}
//         <div className="p-4 lg:p-8">
//           {children}
//         </div>

//       </main>
//     </div>
//   )
// }















// app/dashboard/layout.tsx
"use client";

import { type ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { TrendingUp, Menu, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-sidebar border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Crypto Monitor</span>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
        pathname={pathname}
      />

      {/* Main content */}
      <main className="lg:pl-72 pt-16 lg:pt-0">

        {/* Topbar (Desktop only) */}
        <div className="hidden lg:flex sticky top-0 h-16 z-40 items-center justify-between bg-background/95 backdrop-blur border-b border-border px-8">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10 bg-card border-border" />
          </div>

          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Actual Page Content */}
        <div className="p-4 lg:p-8">
          {children}
        </div>

      </main>
    </div>
  );
}
