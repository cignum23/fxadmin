import useSWR from "swr";
import { useCallback } from "react";

export interface StoredPlatformRate {
  id: string;
  platform_id: string;
  platform_name: string;
  rate_usd: number;
  updated_at: string;
  created_at: string;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch platform rates");
    return r.json();
  });

/**
 * Hook to fetch platform rates from database
 * These rates are updated every 5 minutes by the cron job
 * Falls back to sensible defaults if fetch fails
 */
export function usePlatformRates() {
  const { data, error, isLoading } = useSWR<StoredPlatformRate[]>(
    "/api/fx/platform-rates",
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds for freshness
  );

  /**
   * Get rate for a specific platform
   * Returns 0 if platform not found
   */
  const getRate = useCallback(
    (platformId: string): number => {
      if (!data) return 0;
      const rate = data.find((r) => r.platform_id === platformId);
      return rate?.rate_usd ?? 0;
    },
    [data]
  );

  /**
   * Get all rates as a map for easy lookup
   */
  const ratesMap = useCallback(() => {
    if (!data) return new Map<string, number>();
    return new Map(data.map((r) => [r.platform_id, r.rate_usd]));
  }, [data]);

  return {
    rates: data ?? [],
    isLoading,
    error,
    getRate,
    ratesMap: ratesMap(),
  };
}