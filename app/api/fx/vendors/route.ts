

// //app\api\fx\vendors\route.ts

// app/api/fx/vendors/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const [wiseRes, abokiRes, coinGeckoRes] = await Promise.allSettled([
      axios.get("https://api.wise.com/v1/exchange-rates?source=USD&target=NGN"),
      axios.get("https://abokifx-api.vercel.app/api/usd"),
      axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ngn"),
    ]);

    const vendors = [];

    // ✅ WISE - handle if structure differs
    if (wiseRes.status === "fulfilled") {
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
      } else {
        console.warn("Wise: No rate found in response");
      }
    }

    // ✅ ABOKIFX - support alternate fields
    if (abokiRes.status === "fulfilled") {
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
      } else {
        console.warn("AbokiFX: No rate found in response");
      }
    }

    // ✅ COINGECKO
    if (coinGeckoRes.status === "fulfilled") {
      const data = coinGeckoRes.value.data;
      if (data?.bitcoin?.ngn && data?.bitcoin?.usd) {
        vendors.push({
          name: "CoinGecko",
          rate: Number(data.bitcoin.ngn / data.bitcoin.usd),
          source: "coingecko.com",
          updated_at: new Date().toISOString(),
        });
      } else {
        console.warn("CoinGecko: Missing NGN/USD fields");
      }
    }

    // ✅ Add placeholder entries if none were fetched
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
