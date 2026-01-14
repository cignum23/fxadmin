



//app\dashboard\coinmarketcap\page.tsx


"use client";

import useSWR from "swr";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default function CoinMarketCapPage() {
  const { data: coins, isLoading, error } = useSWR(
    "cmc",
    async () => {
      const res = await fetch("/api/coinmarketcap");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    { refreshInterval: 30000 }
  );

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  
  type Coin = {
    id: string;
    name: string;
    symbol: string;
    quote: {
      USD: {
        price: number;
      };
    };
  };  if (error || !coins)
    return <p className="text-destructive">Failed to load CoinMarketCap data.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">
        CoinMarketCap Prices
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
                    Name
                  </th>
                  <th className="p-3 font-medium text-left">
                    Symbol
                  </th>
                  <th className="p-3 font-medium text-left">
                    Price (USD)
                  </th>
                </tr>
              </thead>

              <tbody>
                {coins.map((coin: Coin) => (
                  <tr
                    key={coin.id}
                    className="text-sm transition border-b border-border hover:bg-cardHover odd:bg-card even:bg-[color-mix(in_srgb,var(--card)_82%,var(--cardHover))]"
                  >
                    <td className="p-3">{coin.name}</td>
                    <td className="p-3 uppercase">{coin.symbol}</td>
                    <td className="p-3 text-foreground font-medium">
                      ${coin.quote.USD.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
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
