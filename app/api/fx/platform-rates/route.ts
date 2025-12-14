import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { CRYPTO_PLATFORMS } from "@/lib/constants/cryptoPlatforms";

interface PlatformRate {
  id: string;
  platform_id: string;
  platform_name: string;
  rate_usd: number;
  updated_at: string;
  created_at: string;
}

/**
 * GET /api/fx/platform-rates
 * Fetch all platform rates from database
 * Used by calculator page to get live rates
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("platform_rates")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[API] Failed to fetch platform rates:", error);
      return NextResponse.json(
        { error: "Failed to fetch platform rates" },
        { status: 500 }
      );
    }

    // If no rates present, synthesize from vendors API as a fallback
    if (!data || data.length === 0) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const vendorsRes = await fetch(`${baseUrl}/api/fx/vendors`, { cache: "no-store" });

        if (vendorsRes.ok) {
          const vendors = (await vendorsRes.json()) as Array<{ name: string; rate: number }>;
          const rates = vendors
            .map((v) => v.rate)
            .filter((r): r is number => typeof r === "number" && r > 0)
            .sort((a, b) => a - b);

          if (rates.length > 0) {
            const mid = Math.floor(rates.length / 2);
            let sharedFxRate = rates.length % 2 === 1 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2;
            sharedFxRate = Math.round(sharedFxRate * 100) / 100;

            const fallback = [
              { platform_id: "coingecko", platform_name: "CoinGecko" },
              { platform_id: "coinmarketcap", platform_name: "CoinMarketCap" },
              { platform_id: "cryptocompare", platform_name: "CryptoCompare" },
              // { platform_id: "binance", platform_name: "Binance" },
              { platform_id: "internal", platform_name: "Internal Engine" },
            ].map((p) => ({
              id: `${p.platform_id}-fallback`,
              platform_id: p.platform_id,
              platform_name: p.platform_name,
              rate_usd: sharedFxRate,
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            }));

            return NextResponse.json(fallback, {
              headers: {
                "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
              },
            });
          }
        }
      } catch (fallbackErr) {
        console.warn("[API] Fallback vendors fetch failed:", fallbackErr);
      }
    }

    // Helper to compute shared FX rate from vendors API (median)
    const computeSharedFxRate = async (): Promise<number | null> => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const vendorsRes = await fetch(`${baseUrl}/api/fx/vendors`, { cache: "no-store" });
        if (!vendorsRes.ok) return null;
        const vendors = (await vendorsRes.json()) as Array<{ name: string; rate: number }>;
        const rates = vendors
          .map((v) => v.rate)
          .filter((r): r is number => typeof r === "number" && r > 0)
          .sort((a, b) => a - b);
        if (rates.length === 0) return null;
        const mid = Math.floor(rates.length / 2);
        const shared = rates.length % 2 === 1 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2;
        return Math.round(shared * 100) / 100;
      } catch (e) {
        console.warn("[API] computeSharedFxRate failed:", e);
        return null;
      }
    };

    // If rows exist but contain zero/invalid rates, normalize with vendors FX fallback
    if (data && data.length > 0) {
      const hasValid = data.some((r) => typeof r.rate_usd === "number" && r.rate_usd > 0);
      if (!hasValid) {
        const sharedFxRate = await computeSharedFxRate();
        if (sharedFxRate && sharedFxRate > 0) {
          const normalized = data.map((r) => ({
            ...r,
            rate_usd: (typeof r.rate_usd === "number" && r.rate_usd > 0) ? r.rate_usd : sharedFxRate,
          }));
          return NextResponse.json(normalized, {
            headers: {
              "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
            },
          });
        }
      }
    }

    // If some required platforms are missing, backfill them with the shared FX rate
    if (data && data.length > 0) {
      const requiredIds = new Set(CRYPTO_PLATFORMS.map((p) => p.id));
     const existingIds = new Set<string>(data.map((r: PlatformRate) => r.platform_id));
      const missing = [...requiredIds].filter((id) => !existingIds.has(id));
      if (missing.length > 0) {
        const sharedFxRate = await computeSharedFxRate();
        if (sharedFxRate && sharedFxRate > 0) {
          const now = new Date().toISOString();
          const backfilled = missing.map((id) => {
            const platform = CRYPTO_PLATFORMS.find((p) => p.id === id)!;
            return {
              id: `${id}-backfill`,
              platform_id: id,
              platform_name: platform?.name ?? id,
              rate_usd: sharedFxRate,
              updated_at: now,
              created_at: now,
            };
          });
          const merged = [...data, ...backfilled];
          return NextResponse.json(merged, {
            headers: {
              "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
            },
          });
        }
      }
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40",
      },
    });
  } catch (err) {
    console.error("[API] Platform rates fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
