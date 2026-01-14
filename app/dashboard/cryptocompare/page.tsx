// //app\dashboard\cryptocompare\page.tsx

"use client";

import useSWR from "swr";
import { fetchCryptoComparePrices } from "@/lib/api";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default function CryptoComparePage() {
  const { data: prices, isLoading, error } = useSWR(
    "cryptocompare",
    fetchCryptoComparePrices,
    { refreshInterval: 30000 }
  );

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-destructive">Failed to load CryptoCompare data.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">
        CryptoCompare Prices
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-[color-mix(in_srgb,var(--border)_55%,transparent)]">
            <table className="min-w-full bg-card text-sm text-foreground">
              <thead className="bg-header text-xs uppercase tracking-wide text-mutedForeground">
                <tr className="border-b border-border">
                  <th className="p-3 font-medium text-left">
                    Coin
                  </th>
                  <th className="p-3 font-medium text-left">
                    USD
                  </th>
                  <th className="p-3 font-medium text-left">
                    NGN
                  </th>
                </tr>
              </thead>

              <tbody>
                {prices && Object.entries(prices).map(
                  ([coin, data]: [string, { USD: number; NGN: number }]) => (
                    <tr
                      key={coin}
                      className="text-sm transition border-b border-border hover:bg-cardHover odd:bg-card even:bg-[color-mix(in_srgb,var(--card)_82%,var(--cardHover))]"
                    >
                      <td className="p-3">{coin}</td>
                      <td className="p-3 text-foreground font-medium">${data.USD.toLocaleString()}</td>
                      <td className="p-3 text-foreground font-medium">₦{data.NGN.toLocaleString()}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
