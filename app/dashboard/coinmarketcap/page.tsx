
// //app\dashboard\coinmarketcap\page.tsx
// "use client";

// import useSWR from "swr";

// type Coin = {
//   id: string;
//   name: string;
//   symbol: string;
//   quote: {
//     USD: {
//       price: number;
//     };
//   };
// };

// export default function CoinMarketCapPage() {
//   const { data: coins, isLoading, error } = useSWR<Coin[]>(
//     "cmc",
//     async () => {
//       const res = await fetch("/api/coinmarketcap");
//       if (!res.ok) throw new Error("Failed to fetch");
//       const raw = await res.json();
//       return raw.map((coin: Coin) => ({
//         ...coin,
//         id: String(coin.id),
//       }));
//     },
//     { refreshInterval: 30000 }
//   );

//   if (isLoading) return <p>Loading...</p>;
//   if (error || !coins) return <p className="text-red-600">Failed to load CoinMarketCap data.</p>;

//   return (
//     <div>
//       <h2 className="text-2xl font-bold mb-4">CoinMarketCap Prices</h2>
//       <table className="w-full bg-white shadow-md rounded-lg">
//         <thead className="bg-gray-100">
//           <tr>
//             <th className="p-2 text-left">Name</th>
//             <th className="p-2 text-left">Symbol</th>
//             <th className="p-2 text-left">Price (USD)</th>
//           </tr>
//         </thead>
//         <tbody>
//           {coins.map((coin) => (
//             <tr key={coin.id} className="border-t">
//               <td className="p-2">{coin.name}</td>
//               <td className="p-2 uppercase">{coin.symbol}</td>
//               <td className="p-2">${coin.quote.USD.price.toFixed(2)}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }







"use client";

import useSWR from "swr";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default function CoinMarketCapPage() {
  const { data: coins, isLoading, error } = useSWR(
    "cmc",
    async () => {
      const res = await fetch("/api/coinmarketcap");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    { refreshInterval: 30000 }
  );

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  
  type Coin = {
    id: string;
    name: string;
    symbol: string;
    quote: {
      USD: {
        price: number;
      };
    };
  };  if (error || !coins)
    return <p className="text-destructive">Failed to load CoinMarketCap data.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">
        CoinMarketCap Prices
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Price (USD)
                  </th>
                </tr>
              </thead>

              <tbody>
                {coins.map((coin: Coin) => (
                  <tr key={coin.id} className="border-b border-border/20 hover:bg-muted/20">
                    <td className="px-4 py-4">{coin.name}</td>
                    <td className="px-4 py-4 uppercase">{coin.symbol}</td>
                    <td className="px-4 py-4">
                      ${coin.quote.USD.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
