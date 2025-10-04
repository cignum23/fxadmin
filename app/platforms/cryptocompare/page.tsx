//app\platforms\cryptocompare\page.tsx
import { fetchCryptoComparePrices } from "@/lib/api";

export default async function CryptoComparePage() {
  const prices = await fetchCryptoComparePrices();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">CryptoCompare Prices</h2>
      <table className="w-full bg-white shadow-md rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Coin</th>
            <th className="p-2 text-left">USD</th>
            <th className="p-2 text-left">NGN</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(prices).map(([coin, data]: [string, { USD: number; NGN: number }]) => (
            <tr key={coin} className="border-t">
              <td className="p-2">{coin}</td>
              <td className="p-2">${data.USD.toLocaleString()}</td>
              <td className="p-2">₦{data.NGN.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
