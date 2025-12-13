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
                {prices && Object.entries(prices).map(
                  ([coin, data]: [string, { USD: number; NGN: number }]) => (
                    <tr key={coin} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="px-4 py-4">{coin}</td>
                      <td className="px-4 py-4">${data.USD.toLocaleString()}</td>
                      <td className="px-4 py-4">₦{data.NGN.toLocaleString()}</td>
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
