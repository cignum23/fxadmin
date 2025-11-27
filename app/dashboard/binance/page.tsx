// app\platforms\binance\page.tsx
"use client";

import useSWR from "swr";
import { fetchBinancePrices } from "@/lib/api";

export default function BinancePage() {
  const { data: prices, error } = useSWR("binance", fetchBinancePrices, {
    refreshInterval: 30000,
  });

  if (!prices && !error) return <p>Loading Binance prices...</p>;
  if (error) return <p className="text-red-600">Failed to load Binance data.</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Binance Prices</h2>
      <table className="w-full bg-white shadow-md rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Coin</th>
            <th className="p-2 text-left">USD</th>
            <th className="p-2 text-left">NGN</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(prices ?? {}).map(([coin, data]) => (
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
