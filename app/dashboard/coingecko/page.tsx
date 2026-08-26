"use client";

import Image from "next/image";
import useSWR from "swr";
import {
  CoinGeckoMarketCoin,
  fetchCoinGeckoChart,
  fetchCoinGeckoPrices,
  fetchUsdToNgnRate,
} from "@/lib/api";
import PriceChart from "@/components/PriceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  if (isLoading) return <p className="font-medium text-muted-foreground">Loading CoinGecko data...</p>;
  if (error || !coins) return <p className="font-semibold text-destructive">Failed to load CoinGecko data.</p>;

  const labels =
    chart?.prices.map(([ts]) =>
      new Date(ts).toLocaleDateString("en-US", { weekday: "short" })
    ) || [];

  const dataPoints = chart?.prices.map(([, price]) => price) || [];

  return (
    <div className="fx-page space-y-6">
      <div>
        <p className="fx-label mb-2">Market Source</p>
        <h1 className="text-3xl font-bold text-[var(--color-text-strong)]">CoinGecko Markets</h1>
        <p className="mt-1 font-medium text-muted-foreground">
          Top 100 cryptocurrency prices powered by CoinGecko.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 100 Coins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="fx-table-shell">
            <table className="fx-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Coin</th>
                  <th>Price (USD)</th>
                  <th>Price (NGN)</th>
                  <th>24h %</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((coin: CoinGeckoMarketCoin) => (
                  <tr key={coin.id}>
                    <td className="font-semibold text-muted-foreground">{coin.market_cap_rank}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Image
                          src={coin.image}
                          alt={coin.name}
                          width={20}
                          height={20}
                          className="rounded-full bg-muted p-0.5"
                        />
                        <span className="font-semibold">
                          {coin.name} ({coin.symbol.toUpperCase()})
                        </span>
                      </div>
                    </td>
                    <td className="font-semibold">${coin.current_price.toLocaleString()}</td>
                    <td className="font-semibold">
                      {fxRate ? `\u20A6${Math.round(coin.current_price * fxRate).toLocaleString()}` : "Loading..."}
                    </td>
                    <td
                      className={cn(
                        "font-bold",
                        coin.price_change_percentage_24h >= 0 ? "text-success" : "text-danger"
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
