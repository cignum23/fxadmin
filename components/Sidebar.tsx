"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  X,
  ChevronRight,
  BarChart,
  Banknote,
  GitCompare,
  Landmark,
  CircleDollarSign,
  Calculator,
  LayoutDashboard,
  Settings,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/abokifx", label: "Aboki FX", icon: Banknote },
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
        "fixed top-0 left-0 z-50 h-full w-[var(--sidebar-width)] bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-transparent flex items-center justify-center">
              <span className="cignum-mark h-9 w-9" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-normal text-sidebar-primary">FX Admin</span>
          </div>

          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 -mr-2 text-sidebar-foreground hover:text-sidebar-primary"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-5 space-y-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "relative flex min-h-14 items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary shadow-[inset_-3px_0_0_var(--sidebar-primary)]"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary",
                )}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center">
                  <item.icon className="w-5 h-5" />
                </span>
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-base font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
          >
            <span className="grid h-10 w-10 place-items-center">
              <LogOut className="w-5 h-5" />
            </span>
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  )
}
