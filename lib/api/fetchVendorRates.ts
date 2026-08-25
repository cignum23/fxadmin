// lib/api/fetchVendorRates.ts
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const TIMEOUT = 1000; // fast timeout, callers fall back to DB cache on failure

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ""
);

export interface VendorRate {
  name: string;
  rate: number;
  source: string;
  pair?: string;
  cached?: boolean;
  updated_at: string;
}

async function fetchLatestRatesFromDB(): Promise<VendorRate[]> {
  try {
    const { data, error } = await supabase
      .from("external_rate_sources")
      .select("source_name, usd_ngn_rate, timestamp")
      .order("timestamp", { ascending: false })
      .limit(10);

    if (error || !data) {
      console.warn("Failed to fetch rates from DB:", error);
      return [];
    }

    const latestRates = new Map<string, Record<string, unknown>>();
    data.forEach((row: Record<string, unknown>) => {
      const source = row.source_name as string;
      if (!latestRates.has(source)) {
        latestRates.set(source, row);
      }
    });

    return Array.from(latestRates.values()).map((row) => ({
      name: row.source_name as string,
      rate: Number(row.usd_ngn_rate),
      source: "database",
      cached: true,
      updated_at: row.timestamp as string,
    }));
  } catch (err) {
    console.error("DB fallback failed:", err);
    return [];
  }
}

/**
 * Fetches USD/NGN comparison rates from external vendors (Wise, AbokiFX, CoinGecko, Binance),
 * falling back to the last rates persisted in external_rate_sources if all vendors fail.
 * Shared by /api/fx/vendors and any server-side caller that previously self-fetched that route.
 */
export async function fetchVendorRates(): Promise<VendorRate[]> {
  try {
    const fetchWithFallbacks = async (urls: string[]) => {
      let lastError: Error | null = null;
      for (const url of urls) {
        try {
          return await axios.get(url, { timeout: TIMEOUT });
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }
      throw lastError;
    };

    const [wiseRes, abokiRes, coinGeckoRes, binanceUSDTRes, binanceUSDCRes] = await Promise.allSettled([
      fetchWithFallbacks([
        "https://api.wise.com/v1/exchange-rates?source=USD&target=NGN",
        "https://api.transferwise.com/v1/exchange-rates?source=USD&target=NGN",
      ]),
      fetchWithFallbacks([
        "https://abokifx-api.vercel.app/api/usd",
        "https://api.abokifx.com/rates",
      ]),
      axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ngn", { timeout: TIMEOUT }),
      axios.get("https://api.binance.com/api/v3/avgPrice?symbol=USDTNGN", { timeout: TIMEOUT }),
      axios.get("https://api.binance.com/api/v3/avgPrice?symbol=USDCNGN", { timeout: TIMEOUT }),
    ]);

    const vendors: VendorRate[] = [];

    if (wiseRes.status === "fulfilled" && wiseRes.value?.data) {
      const rate =
        wiseRes.value?.data?.NGN?.rate ??
        wiseRes.value?.data?.rate ??
        wiseRes.value?.data?.ngn ??
        null;
      if (rate) {
        vendors.push({
          name: "Wise",
          rate: Number(rate),
          source: "wise.com",
          updated_at: new Date().toISOString(),
        });
      }
    } else if (wiseRes.status === "rejected") {
      console.warn("Wise API failed:", (wiseRes.reason as { message?: string })?.message ?? String(wiseRes.reason));
    }

    if (abokiRes.status === "fulfilled" && abokiRes.value?.data) {
      const rate =
        abokiRes.value?.data?.data?.buy_rate ??
        abokiRes.value?.data?.buy_rate ??
        abokiRes.value?.data?.rate ??
        null;
      if (rate) {
        vendors.push({
          name: "AbokiFX",
          rate: Number(rate),
          source: "abokifx-api",
          updated_at: new Date().toISOString(),
        });
      }
    } else if (abokiRes.status === "rejected") {
      console.warn("AbokiFX API failed:", (abokiRes.reason as { message?: string })?.message ?? String(abokiRes.reason));
    }

    if (coinGeckoRes.status === "fulfilled" && coinGeckoRes.value?.data) {
      const data = coinGeckoRes.value.data;
      if (data?.bitcoin?.ngn && data?.bitcoin?.usd) {
        vendors.push({
          name: "CoinGecko",
          rate: Number(data.bitcoin.ngn / data.bitcoin.usd),
          source: "coingecko.com",
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (binanceUSDTRes.status === "fulfilled" && binanceUSDTRes.value?.data?.price) {
      vendors.push({
        name: "Binance_USDT",
        rate: Number(binanceUSDTRes.value.data.price),
        source: "binance.com",
        pair: "USDTNGN",
        updated_at: new Date().toISOString(),
      });
    }

    if (binanceUSDCRes.status === "fulfilled" && binanceUSDCRes.value?.data?.price) {
      vendors.push({
        name: "Binance_USDC",
        rate: Number(binanceUSDCRes.value.data.price),
        source: "binance.com",
        pair: "USDCNGN",
        updated_at: new Date().toISOString(),
      });
    }

    if (vendors.length > 0) {
      return vendors;
    }

    console.warn("All external vendor APIs failed, falling back to database");
    return await fetchLatestRatesFromDB();
  } catch (error) {
    console.error("fetchVendorRates failed:", error);
    try {
      return await fetchLatestRatesFromDB();
    } catch (dbError) {
      console.error("Database fallback also failed:", dbError);
      return [];
    }
  }
}
