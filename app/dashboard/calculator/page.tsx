

// app\dashboard\calculator\page.tsx
"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import {
  fetchCoinGeckoPrices,
  CoinGeckoMarketCoin,
} from "@/lib/api";
import { CRYPTO_PLATFORMS, CryptoPlatformId } from "@/lib/constants/cryptoPlatforms";
import { usePlatformRates } from "@/lib/hooks/usePlatformRates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CalculatorPage() {
  // State management
  const [amount, setAmount] = useState<string>("100");
  const [currency, setCurrency] = useState<"USD" | "NGN">("USD");
  const [platformId, setPlatformId] = useState<CryptoPlatformId>("coingecko");
  const [selectedCoinSymbol, setSelectedCoinSymbol] = useState<string>("BTC");

  // Fetch platform rates from database (updated every 5 minutes by cron)
  const { getRate: getPlatformRate, isLoading: ratesLoading } = usePlatformRates();

  // Fetch crypto list for autocomplete (CoinGecko only for list)
  const { data: geckoCoins } = useSWR<CoinGeckoMarketCoin[]>(
    ["gecko", "usd"],
    () => fetchCoinGeckoPrices("usd"),
    { refreshInterval: 30000 }
  );

  // Vendor shape (used internally when needed)
  // Removed export to avoid unused type warning

  interface CoinMarketCapCoin {
    name: string;
    quote?: {
      USD?: {
        price?: number;
      };
    };
  }

  // Per-platform live FX rate fetchers (USD->NGN)
  async function fetchLiveRate(platform: CryptoPlatformId): Promise<number> {
    try {
      if (platform === "coingecko") {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ngn", { cache: "no-store" });
        const data = await res.json();
        const usd = data?.bitcoin?.usd;
        const ngn = data?.bitcoin?.ngn;
        if (usd && ngn) return Math.round((ngn / usd) * 100) / 100;
      } else if (platform === "binance") {
        const res = await fetch("https://api.binance.com/api/v3/avgPrice?symbol=USDTNGN", { cache: "no-store" });
        const data = await res.json();
        const price = Number(data?.price);
        if (price && price > 0) return Math.round(price * 100) / 100;
      } else if (platform === "cryptocompare") {
        // Derive USD->NGN using BTC prices: NGN from CoinGecko, USD from CryptoCompare
        const [geckoRes, ccRes] = await Promise.all([
          fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=ngn", { cache: "no-store" }),
          fetch("https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD", { cache: "no-store" }),
        ]);
        const geckoData = await geckoRes.json();
        const ccData = await ccRes.json();
        const btcNgn = geckoData?.bitcoin?.ngn;
        const btcUsd = ccData?.USD;
        if (btcNgn && btcUsd && btcUsd > 0) return Math.round((btcNgn / btcUsd) * 100) / 100;
        return 0;
      } else if (platform === "coinmarketcap") {
        // Derive USD->NGN using BTC prices: NGN from CoinGecko, USD from CMC listings
        const [geckoRes, cmcRes] = await Promise.all([
          fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=ngn", { cache: "no-store" }),
          fetch("/api/coinmarketcap", { cache: "no-store" }),
        ]);
        const geckoData = await geckoRes.json();
        const cmcData = await cmcRes.json();
        const btcNgn = geckoData?.bitcoin?.ngn;
        const btc = Array.isArray(cmcData) ? cmcData.find((c: CoinMarketCapCoin) => String(c.name).toLowerCase() === "bitcoin") : null;
        const btcUsd = btc?.quote?.USD?.price;
        if (btcNgn && btcUsd && btcUsd > 0) return Math.round((btcNgn / btcUsd) * 100) / 100;
        return 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  // Live rate for currently selected platform
  const { data: liveRate } = useSWR<number>(
    ["platform-live-rate", platformId],
    () => fetchLiveRate(platformId),
    { refreshInterval: 30000 }
  );

  // Determine if current platform is using a live rate
  const isUsingLive = useMemo(() => {
    return typeof liveRate === "number" && liveRate > 0;
  }, [liveRate]);

  // Selected crypto (always from CoinGecko for list)
  const selectedCrypto = useMemo(() => {
    return geckoCoins?.find((c) => c.symbol.toUpperCase() === selectedCoinSymbol);
  }, [geckoCoins, selectedCoinSymbol]);

  // Calculate conversion amounts using platform-specific rate
  const calculations = useMemo(() => {
    const numAmount = Number.parseFloat(amount) || 0;
    
    // Get the rate for the selected platform
    const dbRate = getPlatformRate(platformId);
    const platformRate = isUsingLive ? liveRate! : dbRate;
    
    if (!platformRate || platformRate === 0 || !selectedCrypto || !selectedCrypto.current_price) {
      return { usd: 0, crypto: 0, ngn: 0, platformRate: 0 };
    }

    const usdAmount = currency === "NGN" ? numAmount / platformRate : numAmount;
    const cryptoAmount = usdAmount / selectedCrypto.current_price;
    const ngnAmount = usdAmount * platformRate;

    return {
      usd: usdAmount,
      crypto: cryptoAmount,
      ngn: ngnAmount,
      platformRate,
    };
  }, [amount, currency, getPlatformRate, platformId, selectedCrypto, isUsingLive, liveRate]);

  // Loading state
  if (!geckoCoins || ratesLoading) {
    return (
      <main className="p-6 bg-bg text-foreground">
        <h1 className="text-2xl font-bold mb-4 text-primary">Calculator</h1>
        <p className="text-muted">Loading crypto data…</p>
      </main>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary ">Crypto Calculator</h1>
        <p className="text-muted-foreground mt-1">Multi-platform currency conversion</p>
      </div>

      {/* Controls */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-12 bg-muted border-border font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as "USD" | "NGN")}>
                <SelectTrigger className="h-12 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="NGN">NGN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platformId} onValueChange={(value) => setPlatformId(value as CryptoPlatformId)}>
                <SelectTrigger className="h-12 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRYPTO_PLATFORMS.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cryptocurrency</Label>
              <Select value={selectedCoinSymbol} onValueChange={setSelectedCoinSymbol}>
                <SelectTrigger className="h-12 bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {geckoCoins.slice(0, 50).map((c) => (
                    <SelectItem key={c.id} value={c.symbol.toUpperCase()}>
                      {c.name} ({c.symbol.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Selected Platform Summary */}
      {selectedCrypto && calculations.platformRate > 0 && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              {CRYPTO_PLATFORMS.find(p => p.id === platformId)?.name || "Calculator"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">USD Equivalent</p>
                <p className="text-2xl font-bold font-mono">
                  ${calculations.usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Crypto Amount</p>
                <p className="text-2xl font-bold font-mono">
                  {calculations.crypto.toFixed(6)} {selectedCrypto.symbol}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NGN Value</p>
                <p className="text-2xl font-bold font-mono">
                  ₦{calculations.ngn.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            {/* Rate provenance badge per selected platform */}
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium text-muted-foreground">
                  {isUsingLive ? "Live rate" : "Last rate (DB)"}
                </span>
              </div>    </div>
            <p className="text-sm text-muted-foreground mt-4">
              {CRYPTO_PLATFORMS.find(p => p.id === platformId)?.name} Rate: ₦{calculations.platformRate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / USD
            </p>
          </CardContent>
        </Card>
      )}

      {/* ✅ Results Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Platform Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Platform
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    USD
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Crypto ({selectedCrypto?.symbol || "N/A"})
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    NGN
                  </th>
                </tr>
              </thead>
              <tbody>
                {CRYPTO_PLATFORMS.map((platform) => {
                  const numAmount = Number.parseFloat(amount) || 0;
                  const dbRateRow = getPlatformRate(platform.id);
                  const isSelected = platform.id === platformId;
                  const rowLive = isSelected && typeof liveRate === "number" && liveRate > 0 ? liveRate! : 0;
                  const platformRate = rowLive > 0 ? rowLive : dbRateRow;
                  
                  // Skip if no rate available for this platform
                  if (!platformRate || platformRate === 0) {
                    return null;
                  }
                  
                  const usdAmount = currency === "NGN" ? numAmount / platformRate : numAmount;
                  const cryptoAmount = selectedCrypto ? usdAmount / selectedCrypto.current_price : 0;
                  const ngnAmount = usdAmount * platformRate;

                  return (
                    <tr
                      key={platform.id}
                      className={cn("hover:bg-muted/20 transition-colors", isSelected && "bg-primary/5")}
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium flex items-center gap-2">
                          {platform.name}
                          {rowLive > 0 ? (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Live</span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-700 border border-blue-200">Last</span>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm">
                        ${usdAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm">
                        {cryptoAmount.toFixed(6)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm">
                        ₦{ngnAmount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
