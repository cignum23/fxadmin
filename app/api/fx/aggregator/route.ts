//app\api\fx\aggregator\route.ts
import { NextResponse } from "next/server";
import { FxVendor } from "@/lib/types"; // shared vendor type

export async function GET() {
  const endpoints = [
    "/api/fx/abokifx",
    "/api/fx/wise",
    "/api/fx/worldremit",
    "/api/fx/payoneer",
    "/api/fx/skrill",
    "/api/fx/westernunion",
    "/api/fx/transfergo",
    "/api/fx/afriex",
    "/api/fx/pay4me",
  ];

  const results: FxVendor[] = [];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const vendor: FxVendor | FxVendor[] = await res.json();
        if (Array.isArray(vendor)) {
          results.push(...vendor);
        } else {
          results.push(vendor);
        }
      }
    } catch (err) {
      console.error(`❌ ${url} failed`, err);
    }
  }

  // ✅ Deduplicate vendors by name, keep freshest updated_at
  const unique: FxVendor[] = Object.values(
    results.reduce<Record<string, FxVendor>>((acc, v) => {
      if (
        !acc[v.name] ||
        (v.updated_at &&
          new Date(v.updated_at) > new Date(acc[v.name].updated_at ?? 0))
      ) {
        acc[v.name] = v;
      }
      return acc;
    }, {})
  );

  return NextResponse.json(unique);
}
