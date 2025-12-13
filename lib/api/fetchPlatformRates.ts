//lib\api\fetchPlatformRates.ts

import axios from "axios";

/**
 * Platform rate with FX conversion
 * Each platform has its own crypto price source but uses the shared FX rate
 */

export interface PlatformRate {
  platform_id: string;
  platform_name: string;
  usd_ngn_rate: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

/**
 * Fetch USD/NGN rate from CoinGecko
 * CoinGecko natively supports NGN, so we calculate the rate directly
 */
async function fetchCoinGeckoRate(fxRate: number): Promise<PlatformRate> {
  try {
    // CoinGecko has native NGN support, so we can get the rate directly
    const res = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
      params: {
        ids: "bitcoin",
        vs_currencies: "usd,ngn",
      },
      timeout: 5000,
    });

    const btcUsd = res.data?.bitcoin?.usd;
    const btcNgn = res.data?.bitcoin?.ngn;

    if (!btcUsd || !btcNgn) {
      throw new Error("Missing BTC price data from CoinGecko");
    }

    // Calculate USD/NGN rate from BTC prices
    const calculatedRate = btcNgn / btcUsd;

    return {
      platform_id: "coingecko",
      platform_name: "CoinGecko",
      usd_ngn_rate: Math.round(calculatedRate * 100) / 100,
      timestamp: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
    // Fallback to shared FX rate
    return {
      platform_id: "coingecko",
      platform_name: "CoinGecko",
      usd_ngn_rate: fxRate,
      timestamp: new Date().toISOString(),
      success: fxRate > 0,
      error: error instanceof Error ? error.message : "Using fallback FX rate",
    };
  }
}

/**
 * Fetch USD/NGN rate from CoinMarketCap
 * Uses shared FX rate since CMC doesn't natively support NGN
 */
async function fetchCoinMarketCapRate(fxRate: number): Promise<PlatformRate> {
  try {
    const apiKey = process.env.CMC_API_KEY;
    if (!apiKey) {
      throw new Error("CMC_API_KEY not configured");
    }

    // Verify CMC is accessible by fetching BTC price in USD
    const res = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=1&convert=USD",
      {
        headers: { "X-CMC_PRO_API_KEY": apiKey },
        timeout: 5000,
      }
    );

    if (!res.data?.data?.[1]?.quote?.USD?.price) {
      throw new Error("CMC BTC/USD price unavailable");
    }

    // Use shared FX rate for consistency
    if (!fxRate || fxRate <= 0) {
      throw new Error("Invalid FX rate provided");
    }

    return {
      platform_id: "coinmarketcap",
      platform_name: "CoinMarketCap",
      usd_ngn_rate: fxRate,
      timestamp: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
    return {
      platform_id: "coinmarketcap",
      platform_name: "CoinMarketCap",
      usd_ngn_rate: 0,
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch USD/NGN rate from CryptoCompare
 * Uses shared FX rate since CryptoCompare doesn't natively support NGN
 */
async function fetchCryptoCompareRate(fxRate: number): Promise<PlatformRate> {
  try {
    // Verify CryptoCompare is accessible by fetching BTC price in USD
    const res = await axios.get(
      "https://min-api.cryptocompare.com/data/price",
      {
        params: { fsym: "BTC", tsyms: "USD" },
        timeout: 5000,
      }
    );

    if (!res.data?.USD || res.data.USD <= 0) {
      throw new Error("CryptoCompare BTC/USD unavailable");
    }

    // Use shared FX rate for consistency
    if (!fxRate || fxRate <= 0) {
      throw new Error("Invalid FX rate provided");
    }

    return {
      platform_id: "cryptocompare",
      platform_name: "CryptoCompare",
      usd_ngn_rate: fxRate,
      timestamp: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
    return {
      platform_id: "cryptocompare",
      platform_name: "CryptoCompare",
      usd_ngn_rate: 0,
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch USD/NGN rate from Binance
 * Uses shared FX rate since Binance doesn't have direct USD/NGN pairs
 */
async function fetchBinanceRate(fxRate: number): Promise<PlatformRate> {
  try {
    // Verify Binance is accessible by checking BTCUSDT price
    const res = await axios.get(
      "https://api.binance.com/api/v3/avgPrice",
      {
        params: { symbol: "BTCUSDT" },
        timeout: 5000,
      }
    );

    if (!res.data?.price || parseFloat(res.data.price) <= 0) {
      throw new Error("Binance BTCUSDT unavailable");
    }

    // Use shared FX rate for consistency
    if (!fxRate || fxRate <= 0) {
      throw new Error("Invalid FX rate provided");
    }

    return {
      platform_id: "binance",
      platform_name: "Binance",
      usd_ngn_rate: fxRate,
      timestamp: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
    return {
      platform_id: "binance",
      platform_name: "Binance",
      usd_ngn_rate: 0,
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch all platform rates in parallel with shared FX rate
 * The FX rate (USD → NGN) is fetched once and shared across all platforms
 * Each platform may override with its own calculation if available
 */
export async function fetchAllPlatformRates(sharedFxRate: number): Promise<PlatformRate[]> {
  const results = await Promise.allSettled([
    fetchCoinGeckoRate(sharedFxRate),
    fetchCoinMarketCapRate(sharedFxRate),
    fetchCryptoCompareRate(sharedFxRate),
    fetchBinanceRate(sharedFxRate),
  ]);

  return results
    .map((result) => (result.status === "fulfilled" ? result.value : null))
    .filter((rate) => rate !== null) as PlatformRate[];
}
