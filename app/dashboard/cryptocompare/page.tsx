// //app\dashboard\cryptocompare\page.tsx
// import { fetchCryptoComparePrices } from "@/lib/api";

// export default async function CryptoComparePage() {
//   const prices = await fetchCryptoComparePrices();

//   return (
//     <div>
//       <h2 className="text-2xl font-bold mb-4">CryptoCompare Prices</h2>
//       <table className="w-full bg-white shadow-md rounded-lg">
//         <thead className="bg-gray-100">
//           <tr>
//             <th className="p-2 text-left">Coin</th>
//             <th className="p-2 text-left">USD</th>
//             <th className="p-2 text-left">NGN</th>
//           </tr>
//         </thead>
//         <tbody>
//           {Object.entries(prices).map(([coin, data]: [string, { USD: number; NGN: number }]) => (
//             <tr key={coin} className="border-t">
//               <td className="p-2">{coin}</td>
//               <td className="p-2">${data.USD.toLocaleString()}</td>
//               <td className="p-2">₦{data.NGN.toLocaleString()}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }


import { fetchCryptoComparePrices } from "@/lib/api";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default async function CryptoComparePage() {
  const prices = await fetchCryptoComparePrices();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">
        CryptoCompare Prices
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
                    Coin
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    USD
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    NGN
                  </th>
                </tr>
              </thead>

              <tbody>
                {Object.entries(prices).map(
                  ([coin, data]: [string, { USD: number; NGN: number }]) => (
                    <tr key={coin} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="px-4 py-4">{coin}</td>
                      <td className="px-4 py-4">${data.USD.toLocaleString()}</td>
                      <td className="px-4 py-4">₦{data.NGN.toLocaleString()}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
