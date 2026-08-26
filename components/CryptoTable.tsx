'use client';

import { useState } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import {
  CoinGeckoMarketCoin,
  fetchBinancePrices,
  fetchCoinGeckoPrices,
  fetchCryptoComparePrices,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PlatformPriceMap = {
  [symbol: string]: {
    coingecko?: number;
    coinmarketcap?: number;
    cryptocompare?: number;
    binance?: number;
  };
};

type CoinMarketCapCoin = {
  symbol: string;
  quote: {
    USD: { price: number };
    NGN?: { price: number };
  };
};

export default function CryptoTable() {
  const [currency, setCurrency] = useState<'usd' | 'ngn'>('usd');

  const { data: geckoCoins, isLoading: gLoading } = useSWR(
    'homepage_coins',
    () => fetchCoinGeckoPrices('usd'),
    { refreshInterval: 30000 }
  );

  const { data: cmcCoins } = useSWR(
    'cmc_home',
    async () => {
      const res = await fetch('/api/coinmarketcap');
      if (!res.ok) throw new Error('Failed to fetch CoinMarketCap data');
      return res.json() as Promise<Array<CoinMarketCapCoin>>;
    },
    { refreshInterval: 30000 }
  );

  const { data: binanceData } = useSWR('binance_home', fetchBinancePrices, {
    refreshInterval: 30000,
  });

  const { data: fxRate } = useSWR('fxRate_crypto', async () => {
    try {
      const res = await fetch('/api/fx/vendors');
      const vendors = await res.json() as Array<{ name: string; rate: number }>;
      const stablecoins = vendors.filter((v) => v.name.includes('USDT') || v.name.includes('USDC'));
      if (stablecoins.length > 0) {
        return stablecoins.reduce((sum, v) => sum + v.rate, 0) / stablecoins.length;
      }
      return vendors[0]?.rate || 1500;
    } catch {
      return 1500;
    }
  });

  const { data: ccPrices } = useSWR('cc_home', fetchCryptoComparePrices, {
    refreshInterval: 30000,
  });

  const isLoading = gLoading || !geckoCoins;

  if (isLoading) {
    return (
      <div className="fx-panel p-8 text-center font-medium text-muted-foreground">
        Loading top cryptocurrencies...
      </div>
    );
  }

  if (!geckoCoins) {
    return (
      <div className="fx-panel border-danger/30 bg-danger/10 p-8 text-center font-semibold text-danger">
        Failed to load data.
      </div>
    );
  }

  const top10 = geckoCoins.slice(0, 10);
  const merged: PlatformPriceMap = {};

  for (const coin of top10) {
    const symbol = coin.symbol.toUpperCase();
    merged[symbol] = { coingecko: coin.current_price };
  }

  if (cmcCoins) {
    for (const coin of cmcCoins) {
      const symbol = coin.symbol.toUpperCase();
      if (merged[symbol]) {
        merged[symbol].coinmarketcap = coin.quote.USD?.price ?? undefined;
      }
    }
  }

  if (ccPrices) {
    for (const symbol in ccPrices) {
      const entry = ccPrices[symbol];
      if (merged[symbol]) {
        merged[symbol].cryptocompare = entry?.USD ?? undefined;
      }
    }
  }

  if (binanceData) {
    for (const symbol of Object.keys(merged)) {
      const entry = binanceData[symbol];
      merged[symbol].binance = entry?.USD ?? undefined;
    }
  }

  return (
    <section className="space-y-6 text-foreground">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="fx-label mb-2">Crypto Prices</p>
          <h1 className="text-3xl font-bold text-[var(--color-text-strong)]">Market Overview</h1>
          <p className="mt-1 font-medium text-muted-foreground">
            Compare prices across major exchanges
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-white/60 p-1">
          {(['usd', 'ngn'] as const).map((item) => (
            <Button
              key={item}
              variant="ghost"
              size="sm"
              onClick={() => setCurrency(item)}
              className={cn(
                'rounded-md px-4 text-sm font-bold uppercase transition',
                currency === item
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary'
              )}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      <div className="fx-table-shell">
        <table className="fx-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Coin</th>
              <th>CoinGecko (USD)</th>
              <th>CoinGecko (NGN)</th>
              <th>CoinMarketCap (USD)</th>
              <th>CoinMarketCap (NGN)</th>
              <th>Binance (USD)</th>
              <th>% 24h</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((coin: CoinGeckoMarketCoin) => {
              const symbol = coin.symbol.toUpperCase();
              const priceSources = merged[symbol];

              return (
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
                      <span className="font-semibold text-foreground">
                        {coin.name} ({symbol})
                      </span>
                    </div>
                  </td>
                  <td className="font-semibold">
                    {priceSources?.coingecko
                      ? `$${priceSources.coingecko.toLocaleString()}`
                      : 'N/A'}
                  </td>
                  <td className="font-semibold">
                    {priceSources?.coingecko && fxRate
                      ? `\u20A6${Math.round(priceSources.coingecko * fxRate).toLocaleString()}`
                      : 'N/A'}
                  </td>
                  <td className="font-semibold">
                    {priceSources?.coinmarketcap
                      ? `$${priceSources.coinmarketcap.toLocaleString()}`
                      : 'N/A'}
                  </td>
                  <td className="font-semibold">
                    {priceSources?.coinmarketcap && fxRate
                      ? `\u20A6${Math.round(priceSources.coinmarketcap * fxRate).toLocaleString()}`
                      : 'N/A'}
                  </td>
                  <td className="font-semibold">
                    {priceSources?.binance
                      ? `$${priceSources.binance.toLocaleString()}`
                      : 'N/A'}
                  </td>
                  <td
                    className={cn(
                      'font-bold',
                      coin.price_change_percentage_24h >= 0 ? 'text-success' : 'text-danger'
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
    </section>
  );
}
