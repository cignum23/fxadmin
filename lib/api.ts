// //lib\api.ts
// import axios, { AxiosError } from "axios";

// // 🔹 CoinGecko Market Coin Type
// export interface CoinGeckoMarketCoin {
//   id: string;
//   symbol: string;
//   name: string;
//   image: string;
//   current_price: number;
//   price_change_percentage_24h: number;
//   market_cap_rank: number;
// }

// // 🔹 CoinGecko Chart Data
// export interface CoinGeckoChartData {
//   prices: [number, number][];
//   market_caps: [number, number][];
//   total_volumes: [number, number][];
// }

// // 🔹 CoinMarketCap Listing Type
// export interface CoinMarketCapListing {
//   id: number;
//   name: string;
//   symbol: string;
//   slug: string;
//   cmc_rank: number;
//   quote: {
//     USD: {
//       price: number;
//       percent_change_24h: number;
//     };
//     NGN: {
//       price: number;
//       percent_change_24h: number;
//     };
//   };
// }

// // 🔁 CoinGecko: Top 100 Prices
// export const fetchCoinGeckoPrices = async (
//   vs_currency: "usd" | "ngn"
// ): Promise<CoinGeckoMarketCoin[]> => {
//   const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs_currency}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`;

//   const res = await axios.get(url);
//   return res.data as CoinGeckoMarketCoin[];
// };

// // 🌍 USD to NGN FX Rate from CoinGecko
// export const fetchUsdToNgnRate = async (): Promise<number> => {
//   const url = "https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=ngn";
//   const res = await axios.get(url);
//   return res.data.usd.ngn;
// };

// // 📈 7-Day Chart for CoinGecko Coin
// export const fetchCoinGeckoChart = async (
//   coinId: string,
//   vs_currency: "usd" | "ngn"
// ): Promise<CoinGeckoChartData> => {
//   const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${vs_currency}&days=7`;
//   const res = await axios.get(url);
//   return res.data as CoinGeckoChartData;
// };

// // 💰 CoinMarketCap Prices (USD + NGN)
// export const fetchCoinMarketCapPrices = async (): Promise<CoinMarketCapListing[]> => {
//   const apiKey = process.env.CMC_API_KEY || "";

//   if (!apiKey) {
//     console.warn("⚠️ CMC_API_KEY not found in environment variables");
//     return [];
//   }

//   const url =
//     "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=100&convert=USD,NGN";

//   try {
//     const res = await axios.get(url, {
//       headers: {
//         "X-CMC_PRO_API_KEY": apiKey,
//       },
//     });

//     if (!res.data?.data) {
//       console.error("❌ No data returned from CoinMarketCap");
//       return [];
//     }

//     return res.data.data as CoinMarketCapListing[];
//   } catch (error: unknown) {
//     const err = error as AxiosError;
//     console.error("❌ Error fetching from CoinMarketCap:", err.response?.data || err.message);
//     return [];
//   }
// };

// // 🔁 CryptoCompare: Limited Coins (USD + NGN)
// export const fetchCryptoComparePrices = async (): Promise<
//   Record<string, { USD: number; NGN: number }>
// > => {
//   const symbols = "BTC,ETH,SOL,BNB,XRP,ADA,DOGE,MATIC,TRX,DOT,USDT,USDC,BUSD,LINK,LTC,XRP,USDT,STETH,AVAX,UNI,SHIB,WBTC,DAI";
//   const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbols}&tsyms=USD,NGN`;

//   try {
//     const res = await axios.get(url);
//     return res.data;
//   } catch (error: unknown) {
//     const err = error as AxiosError;
//     console.error("❌ Error fetching from CryptoCompare:", err.response?.data || err.message);
//     throw new Error("Failed to fetch prices from CryptoCompare");
//   }
// };

// // ➕ Binance: fetch from our API route
// // lib/api.ts

// // Binance prices come from our own API route (no CORS issues)
// export const fetchBinancePrices = async (): Promise<Record<string, { USD: number; NGN: number }>> => {
//   const res = await fetch("/api/binance"); // ✅ call your API route
//   if (!res.ok) throw new Error("Failed to fetch Binance prices");
//   return res.json();
// };







//----------------

// lib/api.ts
import axios, { AxiosError } from "axios";
import { FxVendor } from "./types";

/* Types for CoinGecko market coin */
export interface CoinGeckoMarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
}

/* Chart data */
export interface CoinGeckoChartData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

/* CoinMarketCap listing */
export interface CoinMarketCapListing {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  quote: {
    USD: {
      price: number;
      percent_change_24h: number;
    };
    NGN?: {
      price: number;
      percent_change_24h: number;
    };
  };
}

/* CoinGecko: Top 100 */
export const fetchCoinGeckoPrices = async (
  vs_currency: "usd" | "ngn"
): Promise<CoinGeckoMarketCoin[]> => {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs_currency}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`;
  const res = await axios.get(url);
  return res.data as CoinGeckoMarketCoin[];
};

/* FIX: Use internal FX vendors endpoint to obtain a USD -> NGN rate
   Reason: previous approach used CoinGecko with ids='usd', which is invalid.
   Using our aggregated vendors endpoint centralizes FX data and makes
   the app consistent. */
export const fetchUsdToNgnRate = async (): Promise<number> => {
  try {
    const res = await fetch("/api/fx/vendors");
    if (!res.ok) {
      throw new Error("Failed to fetch FX vendors");
    }
    const vendors = (await res.json()) as FxVendor[];
    // Prefer trusted vendors like Wise first, then AbokiFX, else take median
    const preferred = vendors.find((v) => v.name?.toLowerCase().includes("wise") && v.rate);
    if (preferred && preferred.rate) return preferred.rate;

    const aboki = vendors.find((v) => v.name?.toLowerCase().includes("abokifx") && v.rate);
    if (aboki && aboki.rate) return aboki.rate;

    // Fallback: compute median of available rates
    const numeric = vendors.map((v) => v.rate).filter((r): r is number => typeof r === "number");
    if (numeric.length === 0) {
      throw new Error("No FX vendor rates available");
    }
    numeric.sort((a, b) => a - b);
    const mid = Math.floor(numeric.length / 2);
    return numeric.length % 2 === 1 ? numeric[mid] : (numeric[mid - 1] + numeric[mid]) / 2;
  } catch (err) {
    console.error("❌ fetchUsdToNgnRate failed:", err);
    // As a last resort return a safe default to avoid crash; encourage updating in env
    return 1200; // conservative default; change to match real market in deployment
  }
};

/* CoinGecko 7-day chart */
export const fetchCoinGeckoChart = async (
  coinId: string,
  vs_currency: "usd" | "ngn"
): Promise<CoinGeckoChartData> => {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${vs_currency}&days=7`;
  const res = await axios.get(url);
  return res.data as CoinGeckoChartData;
};

/* CoinMarketCap listing */
export const fetchCoinMarketCapPrices = async (): Promise<CoinMarketCapListing[]> => {
  const apiKey = process.env.CMC_API_KEY || "";
  if (!apiKey) {
    console.warn("⚠️ CMC_API_KEY not found in environment variables");
    return [];
  }
  const url =
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=100&convert=USD,NGN";
  try {
    const res = await axios.get(url, {
      headers: {
        "X-CMC_PRO_API_KEY": apiKey,
      },
    });
    return res.data.data as CoinMarketCapListing[];
  } catch (error: unknown) {
    const err = error as AxiosError;
    console.error("❌ Error fetching from CoinMarketCap:", err.response?.data || err.message);
    return [];
  }
};

/* CryptoCompare */
export const fetchCryptoComparePrices = async (): Promise<
  Record<string, { USD: number; NGN: number }>
> => {
  const symbols =
    "BTC,ETH,SOL,BNB,XRP,ADA,DOGE,MATIC,TRX,DOT,USDT,USDC,BUSD,LINK,LTC,AVAX,UNI,SHIB,WBTC,DAI";
  const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbols}&tsyms=USD,NGN`;
  try {
    const res = await axios.get(url);
    return res.data;
  } catch (error: unknown) {
    const err = error as AxiosError;
    console.error("❌ Error fetching from CryptoCompare:", err.response?.data || err.message);
    throw new Error("Failed to fetch prices from CryptoCompare");
  }
};

/* Binance wrapper (calls your API route) */
export const fetchBinancePrices = async (): Promise<Record<string, { USD: number; NGN: number }>> => {
  const res = await fetch("/api/binance");
  if (!res.ok) throw new Error("Failed to fetch Binance prices");
  return res.json();
};
