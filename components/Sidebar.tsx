// //components\Sidebar.tsx
// "use client";
// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation"
// import { useAuth } from "@/lib/auth-context"
// import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button"
// import { TrendingUp, LogOut, X, ChevronRight, BarChart, GitCompare, Landmark, CircleDollarSign, Calculator, LayoutDashboard } from "lucide-react"

// const navItems = [
//   { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
//   { href: "/dashboard/coingecko", label: "CoinGecko", icon: CircleDollarSign },
//   { href: "/dashboard/coinmarketcap", label: "CoinMarketCap", icon: BarChart },
//   { href: "/dashboard/cryptocompare", label: "CryptoCompare", icon: GitCompare },
//   { href: "/dashboard/binance", label: "Binance", icon: Landmark },
//   { href: "/dashboard/calculator", label: "Calculator", icon: Calculator },
// ];

// interface SidebarProps {
//   sidebarOpen: boolean
//   closeSidebar: () => void
//   pathname: string
// }

// interface DashboardSidebarProps {
//   sidebarOpen: boolean;
//   setSidebarOpen: (open: boolean) => void;
// }

// export default function Sidebar({ sidebarOpen, setSidebarOpen }: DashboardSidebarProps) {
//   const pathname = usePathname()
//   const router = useRouter()
//   const { logout } = useAuth()

//   const handleLogout = () => {
//     logout()
//     router.push("/")
//   }

//   return (
//     <aside
//       className={cn(
//         "fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0",
//         sidebarOpen ? "translate-x-0" : "-translate-x-full",
//       )}
//     >
//       <div className="flex flex-col h-full">
//         {/* Logo */}
//         <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
//           <div className="flex items-center gap-3">
//             <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
//               <TrendingUp className="w-5 h-5 text-primary-foreground" />
//             </div>
//             <span className="text-lg font-semibold tracking-tight">Crypto Monitor</span>
//           </div>
//           <button
//             onClick={() => setSidebarOpen(false)}
//             className="lg:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 p-4 space-y-1">
//           {navItems.map((item) => {
//             const isActive = pathname === item.href
//             return (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 onClick={() => setSidebarOpen(false)}
//                 className={cn(
//                   "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
//                   isActive
//                     ? "bg-sidebar-accent text-sidebar-primary"
//                     : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
//                 )}
//               >
//                 <item.icon className="w-5 h-5" />
//                 {item.label}
//                 {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
//               </Link>
//             )
//           })}
//         </nav>

//         {/* Logout */}
//         <div className="p-4 border-t border-sidebar-border">
//           <Button
//             variant="ghost"
//             onClick={handleLogout}
//             className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
//           >
//             <LogOut className="w-5 h-5" />
//             Sign out
//           </Button>
//         </div>
//       </div>
//     </aside>
//   );
// }








"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  LogOut,
  X,
  ChevronRight,
  BarChart,
  GitCompare,
  Landmark,
  CircleDollarSign,
  Calculator,
  LayoutDashboard,
  Settings,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/coingecko", label: "CoinGecko", icon: CircleDollarSign },
  { href: "/dashboard/coinmarketcap", label: "CoinMarketCap", icon: BarChart },
  { href: "/dashboard/cryptocompare", label: "CryptoCompare", icon: GitCompare },
  { href: "/dashboard/binance", label: "Binance", icon: Landmark },
  { href: "/dashboard/calculator", label: "Calculator", icon: Calculator },
  { href: "/dashboard/management", label: "Rate Management", icon: Settings },
]

interface SidebarProps {
  sidebarOpen: boolean
  closeSidebar: () => void
  pathname: string
}

export default function Sidebar({ sidebarOpen, closeSidebar, pathname }: SidebarProps) {
  const router = useRouter()
const { signout } = useAuth();

const handleLogout = async () => {
  await signout();
  router.push("/login");
};


  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Crypto Monitor</span>
          </div>

          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  )
}
