// app/api/fx/rate-proxy/route.ts
import { NextResponse } from "next/server";
import { fetchVendorRates, type VendorRate } from "@/lib/api/fetchVendorRates";
import { checkRateLimit, getClientIp } from "@/lib/fx-engine/utils/rate-limiter";

/* Small proxy that returns a single number representing USD -> NGN
   It calls the vendor-rate fetcher directly and responds with the computed rate.
   This keeps client fetches simple and avoids exposing internal vendor structure. */

const FALLBACK_RATE = Number(process.env.RATE_PROXY_FALLBACK_RATE) || 1200;

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const vendors = await fetchVendorRates();
    // pick preferred vendor
    const wise = vendors.find((v: VendorRate) => v.name?.toLowerCase().includes("wise") && v.rate);
    if (wise && wise.rate) return NextResponse.json(wise.rate);
    const aboki = vendors.find((v: VendorRate) => v.name?.toLowerCase().includes("abokifx") && v.rate);
    if (aboki && aboki.rate) return NextResponse.json(aboki.rate);

    const numeric = vendors.map((v: VendorRate) => v.rate).filter((r: number | undefined): r is number => typeof r === "number");
    if (numeric.length === 0) return NextResponse.json(FALLBACK_RATE);
    numeric.sort((a: number, b: number) => a - b);
    const mid = Math.floor(numeric.length / 2);
    const final = numeric.length % 2 === 1 ? numeric[mid] : (numeric[mid - 1] + numeric[mid]) / 2;
    return NextResponse.json(final);
  } catch (err) {
    console.error("rate-proxy error", err);
    return NextResponse.json(FALLBACK_RATE);
  }
}
