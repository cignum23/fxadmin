//components\Sidebar.tsx
"use client";
import Link from "next/link";

const platforms = [
  { name: "CoinGecko", path: "/platforms/coingecko" },
  { name: "CoinMarketCap", path: "/platforms/coinmarketcap" },
  { name: "CryptoCompare", path: "/platforms/cryptocompare" },
  { name: "Binance", path: "/platforms/binance" },
  { name: "Calculator", path: "/platforms/calculator" },


];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r shadow-sm h-full p-4 text-gray-950">
      <Link href="/" className="text-xl font-bold mb-6 block hover:text-blue-600 cursor-pointer">
        Crypto Monitor
      </Link>
      <nav className="flex flex-col space-y-4">
        {platforms.map((p) => (
          <Link key={p.name} href={p.path} className="hover:text-blue-600">
            {p.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
