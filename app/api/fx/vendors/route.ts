// app/api/fx/vendors/route.ts
import { NextResponse } from "next/server";
import { fetchVendorRates } from "@/lib/api/fetchVendorRates";

export async function GET() {
  const vendors = await fetchVendorRates();
  const cached = vendors.length > 0 && vendors.every((v) => v.cached);

  return NextResponse.json(vendors, {
    headers: {
      "Cache-Control": cached
        ? "public, s-maxage=60"
        : "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
