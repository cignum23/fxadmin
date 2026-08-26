import { NextResponse } from "next/server";
import {
  fetchAbokiFxRate,
  type AbokiRateMode,
  type AbokiRatesEndpoint,
} from "@/lib/api/abokiFx";

function resolveEndpoint(value: string | null): AbokiRatesEndpoint {
  if (value === "lagos_previous" || value === "otherparallel" || value === "date") {
    return value;
  }

  return "movement";
}

function resolveMode(value: string | null): AbokiRateMode {
  if (value === "buy" || value === "sell") {
    return value;
  }

  return "mid";
}

/**
 * Returns Aboki FX USD/NGN rates for baseline, calculator, and sidebar views.
 */
export async function GET(request: Request) {
  try {
    const reqUrl = new URL(request.url);
    const endpoint = resolveEndpoint(reqUrl.searchParams.get("endpoint")?.toLowerCase() ?? null);
    const mode = resolveMode(reqUrl.searchParams.get("mode")?.toLowerCase() ?? null);
    const currency = (reqUrl.searchParams.get("currency") || "USD").toUpperCase();
    const date = reqUrl.searchParams.get("date") || undefined;

    const result = await fetchAbokiFxRate({ endpoint, currency, date, mode });

    if (!result.rate) {
      return NextResponse.json(result, { status: 503 });
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("[API] AbokiFX route failed:", err);
    return NextResponse.json(
      {
        name: "AbokiFX",
        rate: null,
        mid_rate: null,
        buy_rate: null,
        sell_rate: null,
        currency: "USD",
        endpoint: "movement",
        timestamp: null,
        raw_rate: null,
        source: "abokifx",
        updated_at: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
