// app/dashboard/layout.tsx
"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardView, setDashboardView] = useState<"rates" | "crypto">("rates");

  useEffect(() => {
    const syncView = () => {
      const view = new URLSearchParams(window.location.search).get("view");
      setDashboardView(view === "crypto" ? "crypto" : "rates");
    };

    syncView();
    window.addEventListener("popstate", syncView);
    return () => window.removeEventListener("popstate", syncView);
  }, []);

  const isDashboardHome = pathname === "/dashboard";
  const isFxRateRoute = pathname === "/dashboard/abokifx";
  const isCryptoRoute =
    pathname === "/dashboard/coingecko" ||
    pathname === "/dashboard/coinmarketcap" ||
    pathname === "/dashboard/cryptocompare" ||
    pathname === "/dashboard/binance";

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-sidebar text-sidebar-foreground border-b border-sidebar-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-sidebar-foreground hover:text-sidebar-primary"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-transparent flex items-center justify-center">
              <span className="cignum-mark h-8 w-8" aria-hidden="true" />
            </div>
            <span className="font-semibold">FX Admin</span>
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
      <main className="pt-16 lg:pl-[var(--sidebar-width)] lg:pt-0">

        {/* Topbar (Desktop only) */}
        <div className="hidden lg:grid sticky top-0 z-40 h-20 grid-cols-[320px_1fr_260px] items-center gap-6 bg-background/95 px-8 backdrop-blur border-b border-border">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground" />
            <Input
              placeholder="Search..."
              className="h-12 rounded-md border-[rgba(0,22,25,0.22)] bg-white pl-12 text-base shadow-card"
            />
          </div>

          <nav className="flex items-center justify-center gap-8" aria-label="Dashboard views">
            <Link
              href="/dashboard"
              onClick={() => setDashboardView("rates")}
              className="fx-tab px-1 py-5"
              data-active={(isDashboardHome && dashboardView === "rates") || isFxRateRoute}
            >
              FX Rate Engine
            </Link>
            <Link
              href="/dashboard?view=crypto"
              onClick={() => setDashboardView("crypto")}
              className="fx-tab px-1 py-5"
              data-active={(isDashboardHome && dashboardView === "crypto") || isCryptoRoute}
            >
              Crypto Prices
            </Link>
          </nav>

          <div className="justify-self-end text-base font-medium text-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Actual Page Content */}
        <div className="p-4 sm:p-6 lg:p-10">
          {children}
        </div>

      </main>
    </div>
  );
}
