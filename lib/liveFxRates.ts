//lib\liveFxRates.ts
export type FxVendorRate = { name: string; rate: number; source: string };

export async function fetchLiveFxRates(): Promise<FxVendorRate[]> {
  const endpoints = [
    { name: "WorldRemit", url: "/api/fx/worldremit" },
    { name: "Payoneer", url: "/api/fx/payoneer" },
    { name: "Skrill", url: "/api/fx/skrill" },
    // add others here...
  ];

  const vendors: FxVendorRate[] = [];
  for (const e of endpoints) {
    try {
      const res = await fetch(e.url);
      if (res.ok) {
        const data = await res.json();
        if (data.rate) vendors.push(data);
      }
    } catch (err) {
      console.error(`❌ ${e.name} fetch failed`, err);
    }
  }
  return vendors;
}
