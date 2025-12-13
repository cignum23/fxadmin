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
  if (!geckoCoins) return <p className="text-red-600">Failed to load data.</p>;

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
              <th className="p-2 text-left">CoinGecko (USD)</th>
              <th className="p-2 text-left">CoinGecko (NGN)</th>
              <th className="p-2 text-left">CoinMarketCap (USD)</th>
              <th className="p-2 text-left">CoinMarketCap (NGN)</th>
              <th className="p-2 text-left">Binance (USD)</th>
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
                      ? `$${priceSources.coingecko.toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    {priceSources?.coingecko && fxRate
                      ? `₦${Math.round(priceSources.coingecko * fxRate).toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    {priceSources?.coinmarketcap
                      ? `$${priceSources.coinmarketcap.toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    {priceSources?.coinmarketcap && fxRate
                      ? `₦${Math.round(priceSources.coinmarketcap * fxRate).toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    {priceSources?.binance
                      ? `$${priceSources.binance.toLocaleString()}`
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
