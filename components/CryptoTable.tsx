//components\CryptoTable.tsx
'use client';

import { useState } from 'react';
import useSWR from "swr";
import {
  fetchCoinGeckoPrices,
  fetchCryptoComparePrices,
  fetchBinancePrices,
  CoinGeckoMarketCoin,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import Image from "next/image";
import Link from "next/link";

type PlatformPriceMap = {
  [symbol: string]: {
    coingecko?: number;
    coinmarketcap?: number;
    cryptocompare?: number;
    binance?: number;
  };
};

export default function HomePage() {
  const [currency, setCurrency] = useState<"usd" | "ngn">("usd");

  const { data: geckoCoins, isLoading: gLoading } = useSWR(
    "homepage_coins",
    () => fetchCoinGeckoPrices("usd"),
    { refreshInterval: 30000 }
  );

  type CoinMarketCapCoin = {
    symbol: string;
    quote: {
      USD: { price: number };
      NGN?: { price: number };
    };
  };

  const { data: cmcCoins } = useSWR(
    "cmc_home",
    async () => {
      const res = await fetch("/api/coinmarketcap");
      if (!res.ok) throw new Error("Failed to fetch CoinMarketCap data");
      return res.json() as Promise<Array<CoinMarketCapCoin>>;
    },
    { refreshInterval: 30000 }
  );

  const { data: binanceData } = useSWR("binance_home", fetchBinancePrices, {
    refreshInterval: 30000,
  });

  // Fetch FX rate for consistent NGN conversion
  const { data: fxRate } = useSWR("fxRate_crypto", async () => {
    try {
      const res = await fetch("/api/fx/vendors");
      const vendors = await res.json() as Array<{ name: string; rate: number }>;
      // Prefer stablecoin rates
      const stablecoins = vendors.filter(v => v.name.includes("USDT") || v.name.includes("USDC"));
      if (stablecoins.length > 0) {
        return stablecoins.reduce((sum, v) => sum + v.rate, 0) / stablecoins.length;
      }
      return vendors[0]?.rate || 1500;
    } catch {
      return 1500;
    }
  });

  const { data: ccPrices } = useSWR("cc_home", fetchCryptoComparePrices, {
    refreshInterval: 30000,
  });

  const isLoading = gLoading || !geckoCoins;
  if (isLoading) return <p>Loading top cryptocurrencies...</p>;
  if (!geckoCoins) return <p className="text-danger">Failed to load data.</p>;

  const top10 = geckoCoins.slice(0, 10);
  const merged: PlatformPriceMap = {};

  // Base: CoinGecko (USD)
  for (const coin of top10) {
    const symbol = coin.symbol.toUpperCase();
    merged[symbol] = { coingecko: coin.current_price };
  }

  // Merge CoinMarketCap (USD only)
  if (cmcCoins) {
    for (const coin of cmcCoins) {
      const symbol = coin.symbol.toUpperCase();
      if (merged[symbol]) {
        merged[symbol].coinmarketcap = coin.quote.USD?.price ?? undefined;
      }
    }
  }

  // Merge CryptoCompare (USD)
  if (ccPrices) {
    for (const symbol in ccPrices) {
      const entry = ccPrices[symbol];
      if (merged[symbol]) {
        merged[symbol].cryptocompare = entry?.USD ?? undefined;
      }
    }
  }

  // Merge Binance (USD)
  if (binanceData) {
    for (const symbol of Object.keys(merged)) {
      const entry = binanceData[symbol];
      if (entry) {
        merged[symbol].binance = entry.USD ?? undefined;
      } else {
        merged[symbol].binance = undefined;
      }
    }
  }

  return (
    <main className="p-6 bg-background text-foreground space-y-6 rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Market Overview</h1>
          <p className="text-mutedForeground mt-1">
            Compare prices across major exchanges
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrency('usd')}
            className={cn( 
              "rounded-md px-4 text-sm transition",
              currency === "usd"
                ? "bg-primary text-primaryForeground"
                : "text-mutedForeground hover:text-foreground"
            )}
          >
            USD
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrency('ngn')}
            className={cn(
              "rounded-md px-4 text-sm transition",
              currency === "ngn"
                ? "bg-primary text-primaryForeground"
                : "text-mutedForeground hover:text-foreground"
            )}
          >
            NGN
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-card shadow-card rounded-xl overflow-hidden border border-[color-mix(in_srgb,var(--border)_55%,transparent)]">
          <thead className="bg-header text-xs uppercase tracking-wide text-mutedForeground">
            <tr>
              <th className="p-3 font-medium text-left">#</th>
              <th className="p-3 font-medium text-left">Coin</th>
              <th className="p-3 font-medium text-left">CoinGecko (USD)</th>
              <th className="p-3 font-medium text-left">CoinGecko (NGN)</th>
              <th className="p-3 font-medium text-left">CoinMarketCap (USD)</th>
              <th className="p-3 font-medium text-left">CoinMarketCap (NGN)</th>
              <th className="p-3 font-medium text-left">Binance (USD)</th>
              <th className="p-3 font-medium text-left">% 24h</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((coin: CoinGeckoMarketCoin) => {
              const symbol = coin.symbol.toUpperCase();
              const priceSources = merged[symbol];

              return (
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
                    {coin.name} ({symbol})
                  </td>
                  <td className="p-3 text-foreground font-medium">
                    {priceSources?.coingecko
                      ? `$${priceSources.coingecko.toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td className="p-3 text-foreground font-medium">
                    {priceSources?.coingecko && fxRate
                      ? `₦${Math.round(priceSources.coingecko * fxRate).toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td className="p-3 text-foreground font-medium">
                    {priceSources?.coinmarketcap
                      ? `$${priceSources.coinmarketcap.toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td className="p-3 text-foreground font-medium">
                    {priceSources?.coinmarketcap && fxRate
                      ? `₦${Math.round(priceSources.coinmarketcap * fxRate).toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td className="p-3 text-foreground font-medium">
                    {priceSources?.binance
                      ? `$${priceSources.binance.toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td
                    className={cn(
                      "p-3 font-semibold",
                      coin.price_change_percentage_24h >= 0 ? "text-success" : "text-danger"
                    )}
                  >
                    {coin.price_change_percentage_24h?.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-right">
        {/* <Link
          href="/platforms/coingecko"
          className="text-blue-600 hover:underline text-sm"
        >
          View full market →
        </Link> */}
      </div>
    </main>
  );
}
