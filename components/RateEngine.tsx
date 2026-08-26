'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Chart = dynamic(() => import('./RateChart'), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground">
      Loading chart...
    </div>
  ),
});

interface FinalRate {
  baseline_rate: number;
  crypto_implied_rate: number | null;
  crypto_premium: number;
  liquidity_spread: number;
  desk_spread: number;
  final_usd_ngn_rate: number;
  timestamp: string;
  calculation_method: string;
  baseline_sources?: string[];
  otc_status?: string;
  liquidity_spread_raw?: number;
}

interface HistoryData {
  timestamp: string;
  final_usd_ngn_rate: number;
  baseline_rate: number;
  crypto_implied_rate: number | null;
}

const formatNaira = (value: number) => `\u20A6${value.toFixed(2)}`;

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-t border-[rgba(0,22,25,0.07)] py-4 first:border-t-0">
      <span className="text-base font-medium text-foreground">{label}</span>
      <div className="text-right text-base font-bold text-[var(--color-text-strong)]">{children}</div>
    </div>
  );
}

export function RateEngine() {
  const [currentRate, setCurrentRate] = useState<FinalRate | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Logged-in sessions authorize these calls through the cookie-backed API.
  const fetchRate = async () => {
    try {
      const response = await fetch('/api/fx/rate');

      if (!response.ok) {
        const data = await response.json() as Record<string, unknown>;
        throw new Error((data.error as string) || 'Failed to fetch rate');
      }

      const data = await response.json() as FinalRate;
      setCurrentRate(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/fx/history?limit=50&hours=24');

      if (!response.ok) {
        const errorData = await response.json() as Record<string, unknown>;
        console.error('History API error:', errorData);
        return;
      }

      const data = await response.json() as { data?: Array<Record<string, unknown>> };

      if (!data.data || !Array.isArray(data.data)) {
        console.warn('No history data returned from API');
        setHistory([]);
        return;
      }

      setHistory(
        data.data.map((item) => ({
          timestamp: new Date(String(item.timestamp)).toLocaleTimeString(),
          final_usd_ngn_rate: Number(item.final_usd_ngn_rate),
          baseline_rate: Number(item.baseline_rate),
          crypto_implied_rate: item.crypto_implied_rate ? Number(item.crypto_implied_rate) : null,
        }))
      );
    } catch (err) {
      console.error('History fetch error:', err);
      setHistory([]);
    }
  };

  const refreshRate = async () => {
    setRefreshing(true);
    try {
      await fetchRate();
      await fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchRate(), fetchHistory()]).finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetchRate();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <Card className="p-5 bg-danger/10 border-danger/25">
        <p className="font-semibold text-danger">Error: {error}</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-10 text-center text-muted-foreground">
        Loading current rate...
      </Card>
    );
  }

  if (!currentRate) {
    return (
      <Card className="p-10 text-center text-muted-foreground">
        No rate available yet.
      </Card>
    );
  }

  const rate = currentRate.final_usd_ngn_rate ?? 0;
  const baselineSources = currentRate.baseline_sources ?? [];

  return (
    <section className="space-y-6 text-foreground">
      <Card className="overflow-hidden rounded-2xl border-[rgba(0,22,25,0.12)] bg-[color-mix(in_srgb,var(--color-surface)_86%,white)] p-0">
        <div className="grid min-h-[430px] gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(320px,0.75fr)_minmax(420px,1fr)] lg:p-10">
          <div className="flex min-h-[350px] flex-col justify-between">
            <div className="space-y-6">
              <p className="fx-label">Current Rate</p>
              <div className="space-y-4">
                <div className="fx-value text-6xl sm:text-7xl">
                  {formatNaira(rate)}
                </div>
                <p className="text-lg font-semibold text-[var(--color-text-strong)]">
                  1 USD = {rate.toFixed(2)} NGN
                </p>
                <p className="text-base font-medium text-muted-foreground">
                  Updated: {new Date(currentRate.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                onClick={refreshRate}
                disabled={refreshing}
                className="h-11 min-w-44 rounded-md px-6 text-sm font-extrabold uppercase tracking-[0.08em]"
              >
                {refreshing ? 'Refreshing...' : 'Refresh Rate'}
              </Button>
              <div className="flex items-center gap-3 text-base font-medium text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span>Method: {currentRate.calculation_method}</span>
              </div>
            </div>
          </div>

          <div className="fx-inner-panel p-5 sm:p-7">
            <h2 className="border-b border-[rgba(0,22,25,0.07)] pb-6 text-2xl font-bold text-[var(--color-text-strong)]">
              Rate Components & Calculation Details
            </h2>

            <div className="mt-6">
              <DetailRow label="Baseline Rate:">
                {formatNaira(currentRate.baseline_rate ?? 0)}
              </DetailRow>

              {baselineSources.length > 0 && (
                <div className="mb-4 border-l border-[rgba(80,232,244,0.55)] px-4 py-2 text-base font-medium text-muted-foreground">
                  From {baselineSources.length} source{baselineSources.length !== 1 ? 's' : ''}: {baselineSources.join(', ')}
                </div>
              )}

              {currentRate.crypto_implied_rate && (
                <DetailRow label="Crypto Implied:">
                  {formatNaira(currentRate.crypto_implied_rate ?? 0)}
                </DetailRow>
              )}

              {(currentRate.crypto_premium ?? 0) !== 0 && (
                <DetailRow label="Crypto Premium:">
                  <span
                    className={cn(
                      (currentRate.crypto_premium ?? 0) >= 0 ? 'text-success' : 'text-danger'
                    )}
                  >
                    {(currentRate.crypto_premium ?? 0) >= 0 ? '+' : '-'}
                    {formatNaira(Math.abs(currentRate.crypto_premium ?? 0))}
                  </span>
                </DetailRow>
              )}

              {(currentRate.liquidity_spread_raw ?? 0) !== 0 && (
                <DetailRow label="Liquidity Spread:">
                  <div className="space-y-1">
                    <div className="text-danger">
                      Raw: {formatNaira(currentRate.liquidity_spread_raw ?? 0)}
                    </div>
                    <div
                      className={cn(
                        (currentRate.liquidity_spread ?? 0) >= 0 ? 'text-[var(--color-text-strong)]' : 'text-danger'
                      )}
                    >
                      Clamped: {(currentRate.liquidity_spread ?? 0) >= 0 ? '+' : '-'}
                      {formatNaira(Math.abs(currentRate.liquidity_spread ?? 0))}
                    </div>
                  </div>
                </DetailRow>
              )}

              {(currentRate.desk_spread ?? 0) !== 0 && (
                <DetailRow label="Desk Spread:">
                  <span
                    className={cn(
                      (currentRate.desk_spread ?? 0) >= 0 ? 'text-success' : 'text-danger'
                    )}
                  >
                    {(currentRate.desk_spread ?? 0) >= 0 ? '+' : '-'}
                    {formatNaira(Math.abs(currentRate.desk_spread ?? 0))}
                  </span>
                </DetailRow>
              )}

              {currentRate.otc_status && (
                <div className="flex items-center gap-3 border-t border-[rgba(0,22,25,0.07)] py-4 text-base font-medium">
                  <span className="text-[var(--color-text-strong)]">OTC Desk Status:</span>
                  <span className="fx-badge">{currentRate.otc_status}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {history.length > 0 && <Chart data={history} />}
    </section>
  );
}
