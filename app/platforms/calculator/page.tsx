// //app\platforms\calculator\page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import {
  fetchCoinGeckoPrices,
  CoinGeckoMarketCoin,
} from "@/lib/api";
import { FxVendor } from "@/lib/types";

// Local fetcher for SWR
const fetcherJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch vendors");
  return res.json();
};

type PlatformRow = {
  vendor: string;
  rate: number | null;
  usdEquivalent?: number;
  cryptoEquivalent?: number;
  ngnEquivalent?: number;
  spreadNgn?: number;
  updated_at?: string;
};

export default function CalculatorPage() {
  const [amountInput, setAmountInput] = useState<number>(100);
  const [fiat, setFiat] = useState<"usd" | "ngn">("usd");
  const [platformSelected, setPlatformSelected] = useState<string>("");
  const [selectedCoinSymbol, setSelectedCoinSymbol] = useState<string>("BTC");
  const [error, setError] = useState<string>("");

  // ✅ SWR hooks for data fetching
  const { data: geckoCoins } = useSWR<CoinGeckoMarketCoin[]>(
    ["gecko", "usd"],
    () => fetchCoinGeckoPrices("usd"),
    { refreshInterval: 30000 }
  );

  const {
    data: vendors,
    mutate: refetchVendors,
    isValidating,
  } = useSWR<FxVendor[] | null>("/api/fx/vendors", fetcherJson, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

  const safeVendors: FxVendor[] = Array.isArray(vendors) ? vendors : [];

  // ✅ Default selected platform
  useEffect(() => {
    if (!platformSelected && safeVendors.length > 0) {
      setPlatformSelected(safeVendors[0].name);
    }
  }, [safeVendors, platformSelected]);

  // ✅ Handle numeric input
  const onAmountChange = (v: string) => {
    const num = Number(v);
    if (!Number.isNaN(num)) setAmountInput(num);
  };

  // ✅ Memoized rows calculation
  const { rows, hasValidRate } = useMemo(() => {
    if (!Array.isArray(safeVendors) || !Array.isArray(geckoCoins)) {
      return { rows: [], hasValidRate: false };
    }

    const validVendors = safeVendors.filter(
      (v) => typeof v.rate === "number" && v.rate > 0
    );

    if (validVendors.length === 0) {
      return { rows: [], hasValidRate: false };
    }

    const coinOptions = geckoCoins.slice(0, 50);
    const coin = coinOptions.find(
      (c) => c.symbol.toUpperCase() === selectedCoinSymbol
    );
    const coinPriceUsd = coin?.current_price ?? 0;

    const rows = validVendors.map((v) => {
      const rate = v.rate ?? null;
      if (!rate) return { vendor: v.name, rate: null };

      const amountInUsd =
        fiat === "usd"
          ? Number(amountInput) || 0
          : (Number(amountInput) || 0) / rate;

      const usdEquivalent = fiat === "usd" ? amountInput : amountInUsd;
      const cryptoEquivalent =
        coinPriceUsd > 0 ? usdEquivalent / coinPriceUsd : 0;
      const ngnEquivalent = usdEquivalent * rate;
      const cryptoToNaira = cryptoEquivalent * coinPriceUsd * rate;
      const dollarToNaira = usdEquivalent * rate;
      const spreadNgn = cryptoToNaira - dollarToNaira;

      return {
        vendor: v.name,
        rate,
        usdEquivalent,
        cryptoEquivalent,
        ngnEquivalent,
        spreadNgn,
        updated_at: v.updated_at,
      };
    });

    return { rows, hasValidRate: true };
  }, [safeVendors, fiat, amountInput, selectedCoinSymbol, geckoCoins]);

  // ✅ Handle vendor rate errors (useEffect avoids infinite re-renders)
  useEffect(() => {
    if (!hasValidRate) {
      setError("Can't get vendor rate at the moment");
    } else {
      setError("");
    }
  }, [hasValidRate]);

  // ✅ Retry fetch handler
  const handleRetry = async () => {
    setError("");
    await refetchVendors();
  };

  if (!Array.isArray(geckoCoins)) {
    return (
      <main className="p-6 bg-bg text-foreground">
        <h1 className="text-2xl font-bold mb-4 text-primary">Calculator</h1>
        <p className="text-muted">Loading crypto data…</p>
      </main>
    );
  }

  const selectedRow = rows.find((r) => r.vendor === platformSelected);

  return (
    <main className="p-6 bg-bg text-foreground">
      <h1 className="text-2xl font-bold mb-4 text-primary">
        Multi-Platform Crypto Calculator
      </h1>

      {/* ✅ Error Message + Retry Button */}
      {error && (
        <div className="bg-danger/80 text-white p-4 mb-5 rounded border border-danger/50 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={handleRetry}
            className="ml-4 px-3 py-1 bg-accent text-bg font-medium rounded hover:opacity-90"
            disabled={isValidating}
          >
            {isValidating ? "Retrying..." : "Retry Fetch"}
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <input
          type="number"
          value={amountInput}
          onChange={(e) => onAmountChange(e.target.value)}
          className="border border-muted bg-surface text-foreground p-2 rounded w-40"
          aria-label="amount"
        />

        <select
          value={fiat}
          onChange={(e) => setFiat(e.target.value as "usd" | "ngn")}
          className="border border-muted bg-surface text-foreground p-2 rounded"
        >
          <option value="usd">USD</option>
          <option value="ngn">NGN</option>
        </select>

        <select
          value={platformSelected}
          onChange={(e) => setPlatformSelected(e.target.value)}
          className="border border-muted bg-surface text-foreground p-2 rounded"
        >
          {safeVendors.map((v) => (
            <option
              key={v.name}
              value={v.name}
              className="bg-bg text-foreground"
            >
              {v.name} {v.rate ? `(${v.rate})` : "(no rate)"}
            </option>
          ))}
        </select>

        <select
          value={selectedCoinSymbol}
          onChange={(e) => setSelectedCoinSymbol(e.target.value)}
          className="border border-muted bg-surface text-foreground p-2 rounded"
        >
          {geckoCoins.slice(0, 50).map((c) => (
            <option
              key={c.id}
              value={c.symbol.toUpperCase()}
              className="bg-bg text-foreground"
            >
              {c.name} ({c.symbol.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* ✅ Selected Platform Summary */}
      {selectedRow && (
        <div className="card mb-6 text-foreground border border-muted/30">
          <strong className="text-accent">Selected Platform:</strong>{" "}
          {selectedRow.vendor}
          <div className="text-sm text-muted mt-1">
            USD equivalent: $
            {selectedRow.usdEquivalent?.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
            , Crypto: {selectedRow.cryptoEquivalent?.toFixed(6)}{" "}
            {selectedCoinSymbol}, NGN: ₦
            {selectedRow.ngnEquivalent?.toLocaleString()}
          </div>
          {selectedRow.updated_at && (
            <div className="text-xs text-muted mt-1">
              Updated: {new Date(selectedRow.updated_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* ✅ Results Table — shows all vendors even if one fails */}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-surface rounded-lg border border-muted/30">
            <thead>
              <tr className="text-left text-sm text-muted border-b border-muted/20 bg-bg/40">
                <th className="p-2">Platform</th>
                <th className="p-2">USD</th>
                <th className="p-2">Crypto ({selectedCoinSymbol})</th>
                <th className="p-2">NGN</th>
                <th className="p-2">Spread NGN</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isSelected = r.vendor === platformSelected;
                return (
                  <tr
                    key={r.vendor}
                    className={`${
                      isSelected ? "row-selected" : "hover:bg-bg/60"
                    } border-t border-muted/20`}
                  >
                    <td className="p-2">
                      <div className="font-medium text-foreground">
                        {r.vendor}
                      </div>
                      {r.rate ? (
                        <div className="text-xs text-muted">
                          ₦{r.rate.toLocaleString()} / $1
                        </div>
                      ) : (
                        <div className="text-xs text-danger">
                          Rate not available
                        </div>
                      )}
                    </td>
                    <td className="p-2 text-accent">
                      $
                      {Number(r.usdEquivalent ?? 0).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 }
                      )}
                    </td>
                    <td className="p-2 text-foreground">
                      {Number(r.cryptoEquivalent ?? 0).toFixed(6)}
                    </td>
                    <td className="p-2 text-success">
                      ₦
                      {Number(r.ngnEquivalent ?? 0).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 }
                      )}
                    </td>
                    <td className="p-2 text-muted">
                      ₦
                      {Number(r.spreadNgn ?? 0).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 }
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}



//----------------------


// app/platforms/calculator/page.tsx
// // app/platforms/calculator/page.tsx
// "use client";

// import React, { useMemo, useState, useEffect } from "react";
// import useSWR from "swr";
// import {
//   fetchCoinGeckoPrices,
//   CoinGeckoMarketCoin,
// } from "@/lib/api";
// import { FxVendor } from "@/lib/types";

// // Safe fetcher
// const fetcherJson = async (url: string) => {
//   const res = await fetch(url);
//   if (!res.ok) throw new Error("Failed to fetch vendors");
//   return res.json();
// };

// type PlatformRow = {
//   vendor: string;
//   rate: number | null;
//   usdEquivalent?: number;
//   cryptoEquivalent?: number;
//   ngnEquivalent?: number;
//   spreadNgn?: number;
//   updated_at?: string;
// };

// export default function CalculatorPage() {
//   const [amountInput, setAmountInput] = useState<number>(100);
//   const [fiat, setFiat] = useState<"usd" | "ngn">("usd");
//   const [platformSelected, setPlatformSelected] = useState<string>("");
//   const [selectedCoinSymbol, setSelectedCoinSymbol] = useState<string>("BTC");
//   const [error, setError] = useState<string>("");

//   const { data: geckoCoins } = useSWR<CoinGeckoMarketCoin[]>(
//     ["gecko", "usd"],
//     () => fetchCoinGeckoPrices("usd"),
//     { refreshInterval: 30000 }
//   );

//   const { data: vendors } = useSWR<FxVendor[] | null>(
//     "/api/fx/vendors",
//     fetcherJson,
//     { refreshInterval: 30000 }
//   );

//   // ✅ Safely normalize vendors
//   const safeVendors: FxVendor[] = Array.isArray(vendors) ? vendors : [];

//   // ✅ Set default vendor once vendors are loaded
//   useEffect(() => {
//     if (!platformSelected && safeVendors.length > 0) {
//       setPlatformSelected(safeVendors[0].name);
//     }
//   }, [safeVendors, platformSelected]);

//   const onAmountChange = (v: string) => {
//     const num = Number(v);
//     if (!Number.isNaN(num)) setAmountInput(num);
//   };

//   // ✅ Memoize calculations safely
//   const { rows, hasValidRate } = useMemo(() => {
//     if (!Array.isArray(safeVendors) || !Array.isArray(geckoCoins)) {
//       return { rows: [], hasValidRate: false };
//     }

//     const validVendors = safeVendors.filter(
//       (v) => typeof v.rate === "number" && v.rate > 0
//     );

//     if (validVendors.length === 0) {
//       return { rows: [], hasValidRate: false };
//     }

//     const coinOptions = geckoCoins.slice(0, 50);
//     const coin = coinOptions.find(
//       (c) => c.symbol.toUpperCase() === selectedCoinSymbol
//     );
//     const coinPriceUsd = coin?.current_price ?? 0;

//     const rows = validVendors.map((v) => {
//       const rate = v.rate ?? null;
//       if (!rate) return { vendor: v.name, rate: null };

//       const amountInUsd =
//         fiat === "usd"
//           ? Number(amountInput) || 0
//           : (Number(amountInput) || 0) / rate;

//       const usdEquivalent = fiat === "usd" ? amountInput : amountInUsd;
//       const cryptoEquivalent =
//         coinPriceUsd > 0 ? usdEquivalent / coinPriceUsd : 0;
//       const ngnEquivalent = usdEquivalent * rate;
//       const cryptoToNaira = cryptoEquivalent * coinPriceUsd * rate;
//       const dollarToNaira = usdEquivalent * rate;
//       const spreadNgn = cryptoToNaira - dollarToNaira;

//       return {
//         vendor: v.name,
//         rate,
//         usdEquivalent,
//         cryptoEquivalent,
//         ngnEquivalent,
//         spreadNgn,
//         updated_at: v.updated_at,
//       };
//     });

//     return { rows, hasValidRate: true };
//   }, [safeVendors, fiat, amountInput, selectedCoinSymbol, geckoCoins]);

//   // ✅ Handle error state in a separate effect (not inside useMemo)
//   useEffect(() => {
//     if (!hasValidRate) {
//       setError("Can't get vendor rate at the moment");
//     } else {
//       setError("");
//     }
//   }, [hasValidRate]);

//   if (!Array.isArray(geckoCoins) || safeVendors.length === 0) {
//     return (
//       <main className="p-6 bg-bg text-foreground">
//         <h1 className="text-2xl font-bold mb-4 text-primary">Calculator</h1>
//         <p className="text-muted">Loading rates and vendors…</p>
//       </main>
//     );
//   }

//   const selectedRow = rows.find((r) => r.vendor === platformSelected);

//   return (
//     <main className="p-6 bg-bg text-foreground">
//       <h1 className="text-2xl font-bold mb-4 text-primary">
//         Multi-Platform Crypto Calculator
//       </h1>

//       {error && (
//         <div className="bg-danger text-white p-3 mb-4 rounded border border-danger/40">
//           {error}
//         </div>
//       )}

//       {/* Controls */}
//       <div className="flex flex-wrap gap-3 items-center mb-6">
//         <input
//           type="number"
//           value={amountInput}
//           onChange={(e) => onAmountChange(e.target.value)}
//           className="border border-muted bg-surface text-foreground p-2 rounded w-40"
//           aria-label="amount"
//         />
//         <select
//           value={fiat}
//           onChange={(e) => setFiat(e.target.value as "usd" | "ngn")}
//           className="border border-muted bg-surface text-foreground p-2 rounded"
//         >
//           <option value="usd">USD</option>
//           <option value="ngn">NGN</option>
//         </select>
//         <select
//           value={platformSelected}
//           onChange={(e) => setPlatformSelected(e.target.value)}
//           className="border border-muted bg-surface text-foreground p-2 rounded"
//         >
//           {safeVendors.map((v) => (
//             <option
//               key={v.name}
//               value={v.name}
//               className="bg-bg text-foreground"
//             >
//               {v.name} {v.rate ? `(${v.rate})` : "(no rate)"}
//             </option>
//           ))}
//         </select>
//         <select
//           value={selectedCoinSymbol}
//           onChange={(e) => setSelectedCoinSymbol(e.target.value)}
//           className="border border-muted bg-surface text-foreground p-2 rounded"
//         >
//           {geckoCoins.slice(0, 50).map((c) => (
//             <option
//               key={c.id}
//               value={c.symbol.toUpperCase()}
//               className="bg-bg text-foreground"
//             >
//               {c.name} ({c.symbol.toUpperCase()})
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Selected Platform Summary */}
//       {selectedRow && !error && (
//         <div className="card mb-6 text-foreground border border-muted/30">
//           <strong className="text-accent">Selected Platform:</strong>{" "}
//           {selectedRow.vendor}
//           <div className="text-sm text-muted mt-1">
//             USD equivalent: $
//             {selectedRow.usdEquivalent?.toLocaleString(undefined, {
//               maximumFractionDigits: 2,
//             })}
//             , Crypto: {selectedRow.cryptoEquivalent?.toFixed(6)}{" "}
//             {selectedCoinSymbol}, NGN: ₦
//             {selectedRow.ngnEquivalent?.toLocaleString()}
//           </div>
//           {selectedRow.updated_at && (
//             <div className="text-xs text-muted mt-1">
//               Updated: {new Date(selectedRow.updated_at).toLocaleString()}
//             </div>
//           )}
//         </div>
//       )}

//       {/* Results Table */}
//       {!error && rows.length > 0 && (
//         <div className="overflow-x-auto">
//           <table className="min-w-full bg-surface rounded-lg border border-muted/30">
//             <thead>
//               <tr className="text-left text-sm text-muted border-b border-muted/20 bg-bg/40">
//                 <th className="p-2">Platform</th>
//                 <th className="p-2">USD</th>
//                 <th className="p-2">
//                   Crypto ({selectedCoinSymbol})
//                 </th>
//                 <th className="p-2">NGN</th>
//                 <th className="p-2">Spread NGN</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map((r) => {
//                 const isSelected = r.vendor === platformSelected;
//                 return (
//                   <tr
//                     key={r.vendor}
//                     className={`${
//                       isSelected ? "row-selected" : "hover:bg-bg/60"
//                     } border-t border-muted/20`}
//                   >
//                     <td className="p-2">
//                       <div className="font-medium text-foreground">
//                         {r.vendor}
//                       </div>
//                       {r.rate ? (
//                         <div className="text-xs text-muted">
//                           ₦{r.rate.toLocaleString()} / $1
//                         </div>
//                       ) : (
//                         <div className="text-xs text-danger">
//                           Rate not available
//                         </div>
//                       )}
//                     </td>
//                     <td className="p-2 text-accent">
//                       $
//                       {Number(r.usdEquivalent ?? 0).toLocaleString(
//                         undefined,
//                         { maximumFractionDigits: 2 }
//                       )}
//                     </td>
//                     <td className="p-2 text-foreground">
//                       {Number(r.cryptoEquivalent ?? 0).toFixed(6)}
//                     </td>
//                     <td className="p-2 text-success">
//                       ₦
//                       {Number(r.ngnEquivalent ?? 0).toLocaleString(
//                         undefined,
//                         { maximumFractionDigits: 2 }
//                       )}
//                     </td>
//                     <td className="p-2 text-muted">
//                       ₦
//                       {Number(r.spreadNgn ?? 0).toLocaleString(
//                         undefined,
//                         { maximumFractionDigits: 2 }
//                       )}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </main>
//   );
// }
