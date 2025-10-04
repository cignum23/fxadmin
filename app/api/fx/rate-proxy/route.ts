// app/api/fx/rate-proxy/route.ts
import { NextResponse } from "next/server";

/* Small proxy that returns a single number representing USD -> NGN
   It calls the vendors endpoint and responds with the computed rate.
   This keeps client fetches simple and avoids exposing internal vendor structure. */

interface Vendor {
  name?: string;
  rate?: number;
}

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/fx/vendors`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: "failed" }, { status: 502 });
    const vendors: Vendor[] = await res.json();
    // pick preferred vendor
    const wise = vendors.find((v: Vendor) => v.name?.toLowerCase().includes("wise") && v.rate);
    if (wise && wise.rate) return NextResponse.json(wise.rate);
    const aboki = vendors.find((v: Vendor) => v.name?.toLowerCase().includes("abokifx") && v.rate);
    if (aboki && aboki.rate) return NextResponse.json(aboki.rate);

    const numeric = vendors.map((v: Vendor) => v.rate).filter((r: number | undefined): r is number => typeof r === "number");
    if (numeric.length === 0) return NextResponse.json(1200);
    numeric.sort((a: number, b: number) => a - b);
    const mid = Math.floor(numeric.length / 2);
    const final = numeric.length % 2 === 1 ? numeric[mid] : (numeric[mid - 1] + numeric[mid]) / 2;
    return NextResponse.json(final);
  } catch (err) {
    console.error("rate-proxy error", err);
    return NextResponse.json(1200);
  }
}
