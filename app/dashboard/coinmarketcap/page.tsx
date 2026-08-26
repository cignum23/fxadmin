"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Coin = {
  id: string;
  name: string;
  symbol: string;
  quote: {
    USD: {
      price: number;
    };
  };
};

export default function CoinMarketCapPage() {
  const { data: coins, isLoading, error } = useSWR(
    "cmc",
    async () => {
      const res = await fetch("/api/coinmarketcap");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<Coin[]>;
    },
    { refreshInterval: 30000 }
  );

  if (isLoading) return <p className="font-medium text-muted-foreground">Loading CoinMarketCap data...</p>;
  if (error || !coins) return <p className="font-semibold text-destructive">Failed to load CoinMarketCap data.</p>;

  return (
    <div className="fx-page space-y-6">
      <div>
        <p className="fx-label mb-2">Market Source</p>
        <h1 className="text-3xl font-bold text-[var(--color-text-strong)]">CoinMarketCap Prices</h1>
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
                  <th>Name</th>
                  <th>Symbol</th>
                  <th>Price (USD)</th>
                </tr>
              </thead>

              <tbody>
                {coins.map((coin) => (
                  <tr key={coin.id}>
                    <td className="font-semibold">{coin.name}</td>
                    <td className="font-semibold uppercase text-muted-foreground">{coin.symbol}</td>
                    <td className="font-semibold">
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
