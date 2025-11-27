

// app/platforms/calculator/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import {
  fetchCoinGeckoPrices,
  CoinGeckoMarketCoin,
} from "@/lib/api";
import { FxVendor } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
// Safe fetcher for SWR
const fetcherJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch vendors");
  return res.json();
};

export default function CalculatorPage() {
  const [amount, setAmount] = useState<string>("100");
  const [currency, setCurrency] = useState<"USD" | "NGN">("USD");
  const [platformId, setPlatformId] = useState<string>("");
  const [selectedCoinSymbol, setSelectedCoinSymbol] = useState<string>("BTC");
  const [error, setError] = useState<string>("");

  // ✅ SWR hooks for fetching crypto & FX data
  const { data: geckoCoins } = useSWR<CoinGeckoMarketCoin[]>(
    ["gecko", "usd"],
    () => fetchCoinGeckoPrices("usd"),
    { refreshInterval: 30000 }
  );

  const {
    data: vendors,
    mutate: refetchVendors,
    isValidating,
  } = useSWR<FxVendor[] | null>("/api/fx/vendors", fetcherJson, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

const safeVendors = useMemo<FxVendor[]>(() => {
  return Array.isArray(vendors) ? vendors : [];
}, [vendors]);

  // ✅ Default vendor selection
  useEffect(() => {
    if (!platformId && safeVendors.length > 0) {
      setPlatformId(safeVendors[0].name);
    }
  }, [safeVendors, platformId]);

  const selectedPlatform = useMemo(() => {
    return safeVendors.find((p) => p.name === platformId);
  }, [safeVendors, platformId]);

  const selectedCrypto = useMemo(() => {
    return geckoCoins?.find((c) => c.symbol.toUpperCase() === selectedCoinSymbol);
  }, [geckoCoins, selectedCoinSymbol]);

  // ✅ Compute vendor rows safely
  const calculations = useMemo(() => {
    const numAmount = Number.parseFloat(amount) || 0;
    if (!selectedPlatform || !selectedCrypto || !selectedPlatform.rate) {
      return { usd: 0, crypto: 0, ngn: 0 };
    }

    const usdAmount = currency === "NGN" ? numAmount / selectedPlatform.rate : numAmount;
    const cryptoAmount = usdAmount / selectedCrypto.current_price;
    const ngnAmount = usdAmount * selectedPlatform.rate;

    return {
      usd: usdAmount,
      crypto: cryptoAmount,
      ngn: ngnAmount,
    };
  }, [amount, currency, selectedPlatform, selectedCrypto]);

  const platformComparisons = useMemo(() => {
    if (!selectedCrypto || !selectedCrypto.current_price) return [];

    return safeVendors.map((platform) => {
      const numAmount = Number.parseFloat(amount) || 0;
      const rate = platform.rate ?? 0;
      const usdAmount = currency === "NGN" ? numAmount / rate : numAmount;
      const cryptoAmount = usdAmount / selectedCrypto.current_price;
      const ngnAmount = usdAmount * rate;
      const spreadNgn = platform.name === platformId ? 0 : ngnAmount - calculations.ngn;

      return {
        ...platform,
        usd: usdAmount,
        crypto: cryptoAmount,
        ngn: ngnAmount,
        spreadNgn,
      };
    });
  }, [amount, currency, safeVendors, selectedCrypto, platformId, calculations.ngn]);

  // ✅ Manage error via useEffect
  useEffect(() => {
    const hasValidRate = selectedPlatform && selectedPlatform.rate && selectedCrypto && selectedCrypto.current_price;
    if (!hasValidRate && (geckoCoins || vendors)) { // Only show error if data has loaded but is invalid
      setError("Cannot perform calculations. Please ensure a valid platform and crypto are selected and rates are available.");
    } else {
      setError("");
    }
  }, [selectedPlatform, selectedCrypto, geckoCoins, vendors]);

  // ✅ Retry fetch function
  const handleRetry = async () => {
    setError("");
    await refetchVendors();
  };
  
  // Sort results so selected platform appears first
  const sortedPlatformComparisons = useMemo(() => {
    if (platformComparisons.length === 0) return [];
    const selected = platformComparisons.find((r) => r.name === platformId);
    const others = platformComparisons.filter((r) => r.name !== platformId);
    return selected ? [selected, ...others] : platformComparisons;
  }, [platformComparisons, platformId]);

  // ✅ Loading state
  if (!geckoCoins || !vendors) {
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

      {/* Error Box */}
      {error && (
        <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
          <CardContent className="p-4 flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={handleRetry}
              className="ml-4 px-3 py-1 bg-destructive text-destructive-foreground font-medium rounded hover:opacity-90"
              disabled={isValidating}
            >
              {isValidating ? "Retrying..." : "Retry Fetch"}
            </button>
          </CardContent>
        </Card>
      )}

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
              <Select value={platformId} onValueChange={setPlatformId}>
                <SelectTrigger className="h-12 bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {safeVendors.map((platform) => (
                    <SelectItem key={platform.name} value={platform.name}>
                      {platform.name} {platform.rate ? `(₦${platform.rate.toLocaleString()})` : "(no rate)"}
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
      {selectedPlatform && selectedCrypto && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Selected Platform: {selectedPlatform.name}
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
            {selectedPlatform.updated_at && (
              <p className="text-sm text-muted-foreground mt-4">
                Updated: {new Date(selectedPlatform.updated_at).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ✅ Results Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Platform Comparison
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
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Spread NGN
                  </th>
                </tr>
              </thead>
            <tbody>
              {sortedPlatformComparisons.map((r) => {
                const isSelected = r.name === platformId;
                return (
                  <tr
                    key={r.name}
                    className={cn("hover:bg-muted/20 transition-colors", isSelected && "bg-primary/5")}
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium">{r.name}</p>
                        {r.rate ? (
                          <p className="text-sm text-muted-foreground">
                            ₦{r.rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / $1
                          </p>
                        ) : (
                          <p className="text-sm text-destructive">
                            Rate not available
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm">
                      $
                      {r.usd.toLocaleString("en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm">
                      {r.crypto.toFixed(6)}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm">
                      ₦
                      {r.ngn.toLocaleString("en-US",
                        { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm">
                      <span
                        className={cn(
                          r.spreadNgn > 0 ? "text-green-600" :
                          r.spreadNgn < 0 ? "text-red-600" :
                          r.spreadNgn === 0 && "text-muted-foreground"
                        )}
                      >
                        ₦
                        {r.spreadNgn.toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
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
