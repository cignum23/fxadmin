

// //app\api\fx\vendors\route.ts

// import { NextResponse } from "next/server";
// import axios from "axios";
// import { supabase } from "@/lib/supabase";
// import { FxVendor } from "@/lib/types";

// export async function GET() {
//   const results: FxVendor[] = [];

//   // ✅ Wise (direct API)
//   try {
//     const wise = await axios.get<{ value: number }>(
//       "https://wise.com/rates/live?source=USD&target=NGN"
//     );
//     results.push({
//       name: "Wise",
//       rate: wise.data.value,
//       source: "wise.com",
//       updated_at: new Date().toISOString(),
//     });
//   } catch (e) {
//     console.error("❌ Wise API failed", e);
//   }

// //   // ✅ OFX (direct API)
// //  // ...existing code...
// // try {
// //   const ofx = await axios.get<{
// //     HistoricalPoints: { InterbankRate: number }[];
// //   }>(
// //     "https://api.ofx.com/PublicSite.ApiService/SpotRateHistory?baseCurrency=USD&termCurrency=NGN&period=day"
// //   );
// //   // Use ofx data here, or remove the variable if not needed
// //   // Example:
// //   // const rates = ofx.data.HistoricalPoints;
// // } catch (error: unknown) {
// //   if (axios.isAxiosError(error) && error.response?.status === 404) {
// //     console.error("OFX API endpoint not found (404).");
// //   } else {
// //     console.error("OFX API failed", error);
// //   }
// // }
// // // ...existing code...

//   // ✅ Scraped vendors from Supabase (AbokiFX, Skrill, Western Union, etc.)
//   try {
//     const { data, error } = await supabase
//       .from("fx_vendors")
//       .select("name, rate, source, updated_at")
//       .order("updated_at", { ascending: false });

//     if (error) throw error;
//     if (data) results.push(...(data as FxVendor[]));
//   } catch (e) {
//     console.error("❌ Supabase fetch failed", e);
//   }

//   // ✅ Deduplicate by vendor name (keep latest updated_at)
//   const unique: FxVendor[] = Object.values(
//     results.reduce<Record<string, FxVendor>>((acc, v) => {
//       if (
//         !acc[v.name] ||
//         (v.updated_at &&
//           new Date(v.updated_at) > new Date(acc[v.name].updated_at ?? 0))
//       ) {
//         acc[v.name] = v;
//       }
//       return acc;
//     }, {})
//   );

//   return NextResponse.json(unique);
// }





//===----

// app/api/fx/vendors/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    // ✅ Step 1: Fetch vendor rates from your different sources
    const [wiseRes, abokiRes, coinGeckoRes] = await Promise.allSettled([
      axios.get("https://api.wise.com/v1/exchange-rates?source=USD&target=NGN"),
      axios.get("https://abokifx-api.vercel.app/api/usd"), // example or replace with your real endpoint
      axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ngn"),
    ]);

    // ✅ Step 2: Build a clean response object for each vendor
    const vendors = [];

    // WISE
    if (wiseRes.status === "fulfilled" && wiseRes.value?.data?.rate) {
      vendors.push({
        name: "Wise",
        rate: Number(wiseRes.value.data.rate),
        source: "wise.com",
        updated_at: new Date().toISOString(),
      });
    }

    // ABOKIFX
    if (abokiRes.status === "fulfilled" && abokiRes.value?.data?.buy_rate) {
      vendors.push({
        name: "AbokiFX",
        rate: Number(abokiRes.value.data.buy_rate),
        source: "abokifx-api",
        updated_at: new Date().toISOString(),
      });
    }

    // COINGECKO (as a fallback vendor)
    if (coinGeckoRes.status === "fulfilled" && coinGeckoRes.value?.data?.bitcoin?.ngn) {
      vendors.push({
        name: "CoinGecko",
        rate: Number(coinGeckoRes.value.data.bitcoin.ngn / coinGeckoRes.value.data.bitcoin.usd),
        source: "coingecko.com",
        updated_at: new Date().toISOString(),
      });
    }

    // ✅ Step 3: Handle case where no vendor returned a rate
    if (vendors.length === 0) {
      return NextResponse.json(
        { error: "No vendor rates available" },
        { status: 503 }
      );
    }

    return NextResponse.json(vendors);
  } catch (error) {
    console.error("❌ Error fetching vendor rates:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}
