//components\Topbar.tsx
"use client";

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function Topbar() {
  return (
    <div className="sticky top-0 z-40 h-16 bg-background/95 backdrop-blur border-b border-border hidden lg:flex items-center justify-between px-8">
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search cryptocurrencies..." className="pl-10 bg-card border-border" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}
