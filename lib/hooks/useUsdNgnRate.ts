import useSWR from "swr";

type FxEngineResponse = {
  final_usd_ngn_rate: number;
  baseline_rate: number;
  timestamp: string;
};

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("FX fetch failed");
    return r.json();
  });

export function useUsdNgnRate() {
  const { data, error, isLoading } = useSWR<FxEngineResponse>(
    "/api/fx/usd-ngn-engine",
    fetcher,
    { refreshInterval: 30000 }
  );

  return {
    rate: data?.final_usd_ngn_rate ?? null,
    isLoading,
    error,
  };
}
