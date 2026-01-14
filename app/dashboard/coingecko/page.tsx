

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
          <div className="overflow-x-auto rounded-xl border border-[color-mix(in_srgb,var(--border)_55%,transparent)]">
            <table className="min-w-full bg-card text-sm text-foreground">
              <thead className="bg-header text-xs uppercase tracking-wide text-mutedForeground">
                <tr className="border-b border-border">
                  <th className="p-3 font-medium text-left">
                    #
                  </th>
                  <th className="p-3 font-medium text-left">
                    Coin
                  </th>
                  <th className="p-3 font-medium text-left">
                    Price (USD)
                  </th>
                  <th className="p-3 font-medium text-left">
                    Price (NGN)
                  </th>
                  <th className="p-3 font-medium text-left">
                    24h %
                  </th>
                </tr>
              </thead>
              <tbody>
                {coins.map((coin: CoinGeckoMarketCoin) => (
                  <tr
                    key={coin.id}
                    className="text-sm transition border-b border-border hover:bg-cardHover odd:bg-card even:bg-[color-mix(in_srgb,var(--card)_82%,var(--cardHover))]"
                  >
                    <td className="p-3">{coin.market_cap_rank}</td>
                    <td className="p-3 flex items-center gap-3">
                      <Image
                        src={coin.image}
                        alt={coin.name}
                        width={20}
                        height={20}
                        className="rounded-full bg-muted p-0.5"
                      />
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </td>
                    <td className="p-3 text-foreground font-medium">
                      ${coin.current_price.toLocaleString()}
                    </td>
                    <td className="p-3 text-foreground font-medium">
                      {fxRate ? `₦${Math.round(coin.current_price * fxRate).toLocaleString()}` : "Loading..."}
                    </td>
                    <td
                      className={cn(
                        "p-3 font-semibold",
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
