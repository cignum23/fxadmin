

// app\dashboard\coingecko\page.tsx

"use client";

import useSWR from "swr";
import {
  fetchCoinGeckoPrices,
  fetchCoinGeckoChart,
  fetchUsdToNgnRate,
  CoinGeckoMarketCoin,
} from "@/lib/api";
import PriceChart from "@/components/PriceChart";
import Image from "next/image";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function CoinGeckoPage() {
  const { data: coins, isLoading, error } = useSWR(
    "coins_usd",
    () => fetchCoinGeckoPrices("usd"),
    { refreshInterval: 30000 }
  );

  const { data: chart } = useSWR(["chart", "bitcoin"], () =>
    fetchCoinGeckoChart("bitcoin", "usd")
  );

  const { data: fxRate } = useSWR("fxRate", fetchUsdToNgnRate);

  if (isLoading)
    return <p className="text-muted-foreground">Loading CoinGecko data…</p>;

  if (error || !coins)
    return <p className="text-destructive">Failed to load CoinGecko data.</p>;

  const labels =
    chart?.prices.map(([ts]) =>
      new Date(ts).toLocaleDateString("en-US", { weekday: "short" })
    ) || [];

  const dataPoints = chart?.prices.map(([, price]) => price) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          CoinGecko Markets
        </h1>
        <p className="text-muted-foreground mt-1">
          Top 100 cryptocurrency prices powered by CoinGecko.
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 100 Coins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Coin
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Price (USD)
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Price (NGN)
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    24h %
                  </th>
                </tr>
              </thead>
              <tbody>
                {coins.map((coin: CoinGeckoMarketCoin) => (
                  <tr key={coin.id} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="px-4 py-4">{coin.market_cap_rank}</td>
                    <td className="px-4 py-4 flex items-center gap-2">
                      <Image
                        src={coin.image}
                        alt={coin.name}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </td>
                    <td className="px-4 py-4">
                      ${coin.current_price.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      {fxRate ? `₦${Math.round(coin.current_price * fxRate).toLocaleString()}` : "Loading..."}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-4",
                        coin.price_change_percentage_24h >= 0
                          ? "text-success"
                          : "text-danger"
                      )}
                    >
                      {coin.price_change_percentage_24h?.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <PriceChart labels={labels} dataPoints={dataPoints} coin="Bitcoin" />
    </div>
  );
}
