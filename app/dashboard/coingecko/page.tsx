
// //app\dashboard\coingecko\page.tsx
// "use client";

// import { useState } from "react";
// import useSWR from "swr";
// import {
//   fetchCoinGeckoPrices,
//   fetchCoinGeckoChart,
//   fetchUsdToNgnRate,
//   CoinGeckoMarketCoin,
// } from "@/lib/api";
// import PriceChart from "@/components/PriceChart";
// import Image from "next/image";

// const fetcher = (currency: "usd" | "ngn") => fetchCoinGeckoPrices(currency);
// const chartFetcher = async (coinId: string, currency: "usd" | "ngn") =>
//   fetchCoinGeckoChart(coinId, currency);

// export default function CoinGeckoPage() {
//   const [currency, setCurrency] = useState<"usd" | "ngn">("usd");

//   const { data: coins, isLoading, error } = useSWR(["coins", currency], () => fetcher(currency), {
//     refreshInterval: 30000,
//   });

//   const { data: chart } = useSWR(["chart", "bitcoin", currency], () =>
//     chartFetcher("bitcoin", currency)
//   );

//   const fxRate = useSWR("fxRate", fetchUsdToNgnRate, {
//     refreshInterval: 60000,
//   }).data;

//   if (isLoading) return <p>Loading...</p>;
//   if (error || !coins) return <p className="text-red-600">Failed to load CoinGecko data.</p>;

//   const labels =
//     chart?.prices.map(([ts]) =>
//       new Date(ts).toLocaleDateString("en-US", { weekday: "short" })
//     ) || [];
//   const dataPoints = chart?.prices.map(([, price]) => price) || [];

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-4 text-gray-950">
//         <h2 className="text-2xl font-bold">Top 100 Coins (CoinGecko)</h2>
//         <div className="space-x-2">
//           <button
//             onClick={() => setCurrency("usd")}
//             className={`px-4 py-1 rounded-md text-sm border ${
//               currency === "usd" ? "bg-blue-500 text-white" : "bg-white"
//             }`}
//           >
//             USD
//           </button>
//           <button
//             onClick={() => setCurrency("ngn")}
//             className={`px-4 py-1 rounded-md text-sm border ${
//               currency === "ngn" ? "bg-blue-500 text-white" : "bg-white"
//             }`}
//           >
//             NGN
//           </button>
//         </div>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="min-w-full bg-white shadow-md rounded-lg">
//           <thead className="bg-gray-100 text-sm">
//             <tr>
//               <th className="p-2 text-left">#</th>
//               <th className="p-2 text-left">Coin</th>
//               <th className="p-2 text-left">Price</th>
//               <th className="p-2 text-left">% 24h</th>
//             </tr>
//           </thead>
//           <tbody>
//             {coins.map((coin: CoinGeckoMarketCoin) => (
//               <tr key={coin.id} className="border-t text-sm hover:bg-gray-50">
//                 <td className="p-2">{coin.market_cap_rank}</td>
//                 <td className="p-2 flex items-center gap-2">
//                   <Image
//                     src={coin.image}
//                     alt={coin.name}
//                     width={20}
//                     height={20}
//                     className="rounded-full"
//                   />
//                   {coin.name} ({coin.symbol.toUpperCase()})
//                 </td>
//                 <td className="p-2">
//                   {currency === "usd"
//                     ? `$${coin.current_price.toLocaleString()}`
//                     : fxRate
//                     ? `₦${Math.round(coin.current_price * fxRate).toLocaleString()}`
//                     : "Loading..."}
//                 </td>
//                 <td
//                   className={`p-2 ${
//                     coin.price_change_percentage_24h >= 0 ? "text-green-600" : "text-red-600"
//                   }`}
//                 >
//                   {coin.price_change_percentage_24h?.toFixed(2)}%
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <PriceChart labels={labels} dataPoints={dataPoints} coin="Bitcoin" />
//     </div>
//   );
// }




"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  fetchCoinGeckoPrices,
  fetchCoinGeckoChart,
  fetchUsdToNgnRate,
  CoinGeckoMarketCoin,
} from "@/lib/api";
import PriceChart from "@/components/PriceChart";
import Image from "next/image";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CoinGeckoPage() {
  const [currency, setCurrency] = useState<"usd" | "ngn">("usd");

  const { data: coins, isLoading, error } = useSWR(
    ["coins", currency],
    () => fetchCoinGeckoPrices(currency),
    { refreshInterval: 30000 }
  );

  const { data: chart } = useSWR(["chart", "bitcoin", currency], () =>
    fetchCoinGeckoChart("bitcoin", currency)
  );

  const fxRate = useSWR("fxRate", fetchUsdToNgnRate).data;

  if (isLoading)
    return <p className="text-muted-foreground">Loading CoinGecko data…</p>;

  if (error || !coins)
    return <p className="text-destructive">Failed to load CoinGecko data.</p>;

  const labels =
    chart?.prices.map(([ts]) =>
      new Date(ts).toLocaleDateString("en-US", { weekday: "short" })
    ) || [];

  const dataPoints = chart?.prices.map(([, price]) => price) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          CoinGecko Markets
        </h1>
        <p className="text-muted-foreground mt-1">
          Top 100 cryptocurrency prices powered by CoinGecko.
        </p>
      </div>

      {/* Currency Switch */}
      <div className="flex items-center gap-2">
        <Button
          variant={currency === "usd" ? "default" : "outline"}
          onClick={() => setCurrency("usd")}
        >
          USD
        </Button>
        <Button
          variant={currency === "ngn" ? "default" : "outline"}
          onClick={() => setCurrency("ngn")}
        >
          NGN
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 100 Coins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Coin
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    24h %
                  </th>
                </tr>
              </thead>
              <tbody>
                {coins.map((coin: CoinGeckoMarketCoin) => (
                  <tr key={coin.id} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="px-4 py-4">{coin.market_cap_rank}</td>
                    <td className="px-4 py-4 flex items-center gap-2">
                      <Image
                        src={coin.image}
                        alt={coin.name}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </td>
                    <td className="px-4 py-4">
                      {currency === "usd"
                        ? `$${coin.current_price.toLocaleString()}`
                        : fxRate
                        ? `₦${Math.round(coin.current_price * fxRate).toLocaleString()}`
                        : "Loading..."}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-4",
                        coin.price_change_percentage_24h >= 0
                          ? "text-success"
                          : "text-danger"
                      )}
                    >
                      {coin.price_change_percentage_24h?.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <PriceChart labels={labels} dataPoints={dataPoints} coin="Bitcoin" />
    </div>
  );
}
