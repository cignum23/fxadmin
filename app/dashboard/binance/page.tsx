"use client";

import useSWR from "swr";
import { fetchBinancePrices } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Price = { USD: number; NGN: number };

export default function BinancePage() {
  const { data: prices, error } = useSWR("binance", fetchBinancePrices, {
    refreshInterval: 30000,
  });

  if (!prices && !error) return <p className="font-medium text-muted-foreground">Loading Binance data...</p>;
  if (error) return <p className="font-semibold text-destructive">Failed to load Binance data.</p>;

  return (
    <div className="fx-page space-y-6">
      <div>
        <p className="fx-label mb-2">Market Source</p>
        <h1 className="text-3xl font-bold text-[var(--color-text-strong)]">Binance Prices</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="fx-table-shell">
            <table className="fx-table">
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>USD</th>
                  <th>NGN</th>
                </tr>
              </thead>
              <tbody>
                {prices && Object.entries(prices as Record<string, Price>).map(([coin, data]) => (
                  <tr key={coin}>
                    <td className="font-semibold">{coin}</td>
                    <td className="font-semibold">${data.USD.toLocaleString()}</td>
                    <td className="font-semibold">{"\u20A6"}{data.NGN.toLocaleString()}</td>
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
