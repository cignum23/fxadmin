// app\dashboard\binance\page.tsx
"use client";

import useSWR from "swr";
import { fetchBinancePrices } from "@/lib/api";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default function BinancePage() {
  const { data: prices, error } = useSWR("binance", fetchBinancePrices, {
    refreshInterval: 30000,
  });

  if (!prices && !error) return <p className="text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-destructive">Failed to load Binance data.</p>;

  type Price = { USD: number; NGN: number };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Binance Prices</h1>

      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Coin
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    USD
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    NGN
                  </th>
                </tr>
              </thead>
              <tbody>
                {prices && Object.entries(prices as Record<string, Price>).map(([coin, data]) => (
                  <tr key={coin} className="border-b border-border/20 hover:bg-muted/20">
                    <td className="px-4 py-4">{coin}</td>
                    <td className="px-4 py-4">${data.USD.toLocaleString()}</td>
                    <td className="px-4 py-4">₦{data.NGN.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
