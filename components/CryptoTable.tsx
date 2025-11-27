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

const currencySymbol = {
  usd: "$",
  ngn: "₦",
};

export default function HomePage() {
  const [currency, setCurrency] = useState<"usd" | "ngn">("usd");

  const { data: geckoCoins, isLoading: gLoading } = useSWR(
    ["homepage_coins", currency],
    () => fetchCoinGeckoPrices(currency),
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

  // Removed unused fxRate to fix unused variable error

  const { data: ccPrices } = useSWR("cc_home", fetchCryptoComparePrices, {
    refreshInterval: 30000,
  });

  const isLoading = gLoading || !geckoCoins;
  if (isLoading) return <p>Loading top cryptocurrencies...</p>;
  if (!geckoCoins) return <p className="text-red-600">Failed to load data.</p>;

  const top10 = geckoCoins.slice(0, 10);
  const merged: PlatformPriceMap = {};

  // Base: CoinGecko
  for (const coin of top10) {
    const symbol = coin.symbol.toUpperCase();
    merged[symbol] = { coingecko: coin.current_price };
  }

  // Merge CoinMarketCap
  if (cmcCoins) {
    for (const coin of cmcCoins) {
      const symbol = coin.symbol.toUpperCase();
      if (merged[symbol]) {
        merged[symbol].coinmarketcap =
          currency === "usd" ? coin.quote.USD?.price ?? undefined : coin.quote.NGN?.price ?? undefined;
      }
    }
  }

  // Merge CryptoCompare
  if (ccPrices) {
    for (const symbol in ccPrices) {
      const entry = ccPrices[symbol];
      if (merged[symbol]) {
        merged[symbol].cryptocompare =
          currency === "usd" ? entry?.USD ?? undefined : entry?.NGN ?? undefined;
      }
    }
  }

  // ✅ FIX: Merge Binance with safe fallback
  if (binanceData) {
    for (const symbol of Object.keys(merged)) {
      const entry = binanceData[symbol];
      if (entry) {
        merged[symbol].binance =
          currency === "usd" ? entry.USD ?? undefined : entry.NGN ?? undefined;
      } else {
        merged[symbol].binance = undefined; // fallback if missing
      }
    }
  }

  return (
    <main className="p-6 text-gray-950 bg-[#e5e5e6] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Overview</h1>
          <p className="text-muted-foreground mt-1">
            Compare prices across major exchanges
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card rounded-xl p-1 border border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrency('usd')}
            className={cn( 
              'rounded-lg px-4',
              currency === 'usd' && 'bg-primary text-primary-foreground hover:bg-primary'
            )}
          >
            USD
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrency('ngn')}
            className={cn('rounded-lg px-4', currency === 'ngn' && 'bg-primary text-primary-foreground hover:bg-primary')}
          >
            NGN
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Coin</th>
              <th className="p-2 text-left">CoinGecko</th>
              <th className="p-2 text-left">CoinMarketCap</th>
              <th className="p-2 text-left">CryptoCompare</th>
              <th className="p-2 text-left">Binance</th>
              <th className="p-2 text-left">% 24h</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((coin: CoinGeckoMarketCoin) => {
              const symbol = coin.symbol.toUpperCase();
              const priceSources = merged[symbol];

              return (
                <tr key={coin.id} className="border-t text-sm hover:bg-gray-50">
                  <td className="p-2">{coin.market_cap_rank}</td>
                  <td className="p-2 flex items-center gap-2">
                    <Image
                      src={coin.image}
                      alt={coin.name}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    {coin.name} ({symbol})
                  </td>
                  <td className="p-2">
                    {priceSources?.coingecko
                      ? `${currencySymbol[currency]}${priceSources.coingecko.toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    {priceSources?.coinmarketcap
                      ? `${currencySymbol[currency]}${priceSources.coinmarketcap.toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    {priceSources?.cryptocompare
                      ? `${currencySymbol[currency]}${priceSources.cryptocompare.toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    {priceSources?.binance
                      ? `${currencySymbol[currency]}${priceSources.binance.toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td
                    className={`p-2 ${
                      coin.price_change_percentage_24h >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
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
        <Link
          href="/platforms/coingecko"
          className="text-blue-600 hover:underline text-sm"
        >
          View full market →
        </Link>
      </div>
    </main>
  );
}
