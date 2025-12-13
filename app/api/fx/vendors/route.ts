
// app/api/fx/vendors/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const TIMEOUT = 1000; // Reduce timeout from 3s to 1s for faster fallback

// Initialize Supabase for server-side DB access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ""
);

async function fetchLatestRatesFromDB() {
  try {
    const { data, error } = await supabase
      .from('external_rate_sources')
      .select('source_name, usd_ngn_rate, timestamp')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error || !data) {
      console.warn('Failed to fetch rates from DB:', error);
      return [];
    }

    // Group by source_name and take the latest rate for each
    const latestRates = new Map();
    data.forEach((row: Record<string, unknown>) => {
      const source = row.source_name as string;
      if (!latestRates.has(source)) {
        latestRates.set(source, row);
      }
    });

    return Array.from(latestRates.values());
  } catch (err) {
    console.error('DB fallback failed:', err);
    return [];
  }
}

export async function GET() {
  try {
    // Fetch with timeout and fallback URLs
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

    const vendors = [];
    
    // Debug logging
    console.log('Wise:', wiseRes.status);
    console.log('AbokiFX:', abokiRes.status);
    console.log('CoinGecko:', coinGeckoRes.status);
    console.log('Binance USDT:', binanceUSDTRes.status);
    console.log('Binance USDC:', binanceUSDCRes.status);
    
    if (wiseRes.status === 'rejected') console.log('Wise error:', wiseRes.reason?.message);
    if (abokiRes.status === 'rejected') console.log('AbokiFX error:', abokiRes.reason?.message);
    if (coinGeckoRes.status === 'rejected') console.log('CoinGecko error:', coinGeckoRes.reason?.message);
    if (binanceUSDTRes.status === 'rejected') console.log('Binance USDT error:', binanceUSDTRes.reason?.message);
    if (binanceUSDCRes.status === 'rejected') console.log('Binance USDC error:', binanceUSDCRes.reason?.message);

    // ✅ WISE - handle if structure differs
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
      const error = wiseRes.reason as Record<string, unknown>;
      console.warn('Wise API failed:', (error as {message?: string})?.message || wiseRes.reason);
    }

    // ✅ ABOKIFX - support alternate fields
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
      const error = abokiRes.reason as Record<string, unknown>;
      console.warn('AbokiFX API failed:', (error as {message?: string})?.message || String(abokiRes.reason));
    }

    // ✅ COINGECKO
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

    // ✅ BINANCE USDT - accurate stablecoin rate
    if (binanceUSDTRes.status === "fulfilled" && binanceUSDTRes.value?.data?.price) {
      vendors.push({
        name: "Binance_USDT",
        rate: Number(binanceUSDTRes.value.data.price),
        source: "binance.com",
        pair: "USDTNGN",
        updated_at: new Date().toISOString(),
      });
    }

    // ✅ BINANCE USDC - alternative stablecoin rate
    if (binanceUSDCRes.status === "fulfilled" && binanceUSDCRes.value?.data?.price) {
      vendors.push({
        name: "Binance_USDC",
        rate: Number(binanceUSDCRes.value.data.price),
        source: "binance.com",
        pair: "USDCNGN",
        updated_at: new Date().toISOString(),
      });
    }

    // ✅ If we got some live rates, return them
    if (vendors.length > 0) {
      return NextResponse.json(vendors, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      });
    }

    // ✅ Fallback: Try to get rates from database
    console.warn('All external APIs failed, falling back to database');
    const dbRates = await fetchLatestRatesFromDB();
    
    if (dbRates.length > 0) {
      const dbVendors = dbRates.map((row: Record<string, unknown>) => ({
        name: row.source_name,
        rate: Number(row.usd_ngn_rate),
        source: 'database',
        cached: true,
        updated_at: row.timestamp,
      }));
      
      return NextResponse.json(dbVendors, {
        headers: {
          'Cache-Control': 'public, s-maxage=60'
        }
      });
    }

    // ✅ No rates available
    console.error('No rates available from external APIs or database');
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'public, s-maxage=30'
      }
    });
  } catch (error) {
    console.error("❌ Error fetching vendor rates:", error);
    
    // Attempt database fallback on error
    try {
      const dbRates = await fetchLatestRatesFromDB();
      if (dbRates.length > 0) {
        const dbVendors = dbRates.map((row: Record<string, unknown>) => ({
          name: row.source_name,
          rate: Number(row.usd_ngn_rate),
          source: 'database',
          cached: true,
          updated_at: row.timestamp,
        }));
        
        return NextResponse.json(dbVendors, {
          headers: {
            'Cache-Control': 'public, s-maxage=60'
          }
        });
      }
    } catch (dbError) {
      console.error('Database fallback also failed:', dbError);
    }
    
    // Return empty array if all fallbacks fail
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'public, s-maxage=30'
      }
    });
  }
}






//===----

// // app/api/fx/vendors/route.ts
// import { NextResponse } from "next/server";
// import axios from "axios";

// export async function GET() {
//   try {
//     // ✅ Step 1: Fetch vendor rates from your different sources
//     const [wiseRes, abokiRes, coinGeckoRes] = await Promise.allSettled([
//       axios.get("https://api.wise.com/v1/exchange-rates?source=USD&target=NGN"),
//       axios.get("https://abokifx-api.vercel.app/api/usd"), // example or replace with your real endpoint
//       axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ngn"),
//     ]);

//     // ✅ Step 2: Build a clean response object for each vendor
//     const vendors = [];

//     // WISE
//     if (wiseRes.status === "fulfilled" && wiseRes.value?.data?.rate) {
//       vendors.push({
//         name: "Wise",
//         rate: Number(wiseRes.value.data.rate),
//         source: "wise.com",
//         updated_at: new Date().toISOString(),
//       });
//     }

//     // ABOKIFX
//     if (abokiRes.status === "fulfilled" && abokiRes.value?.data?.buy_rate) {
//       vendors.push({
//         name: "AbokiFX",
//         rate: Number(abokiRes.value.data.buy_rate),
//         source: "abokifx-api",
//         updated_at: new Date().toISOString(),
//       });
//     }

//     // COINGECKO (as a fallback vendor)
//     if (coinGeckoRes.status === "fulfilled" && coinGeckoRes.value?.data?.bitcoin?.ngn) {
//       vendors.push({
//         name: "CoinGecko",
//         rate: Number(coinGeckoRes.value.data.bitcoin.ngn / coinGeckoRes.value.data.bitcoin.usd),
//         source: "coingecko.com",
//         updated_at: new Date().toISOString(),
//       });
//     }

//     // ✅ Step 3: Handle case where no vendor returned a rate
//     if (vendors.length === 0) {
//       return NextResponse.json(
//         { error: "No vendor rates available" },
//         { status: 503 }
//       );
//     }

//     return NextResponse.json(vendors);
//   } catch (error) {
//     console.error("❌ Error fetching vendor rates:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error", details: String(error) },
//       { status: 500 }
//     );
//   }
// }
