'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Dynamically import chart to prevent hydration issues
const Chart = dynamic(() => import('./RateChart'), { 
  ssr: false, 
  loading: () => <div className="h-80 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">Loading chart...</div> 
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

export function RateEngine() {
  const [currentRate, setCurrentRate] = useState<FinalRate | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const fetchRate = async () => {
    try {
      if (!apiKey) {
        setError('API key required');
        return;
      }

      const response = await fetch('/api/fx/rate', {
        headers: { 'x-api-key': apiKey }
      });

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
      if (!apiKey) return;

      const response = await fetch('/api/fx/history?limit=50&hours=24', {
        headers: { 'x-api-key': apiKey }
      });

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
          crypto_implied_rate: item.crypto_implied_rate ? Number(item.crypto_implied_rate) : null
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
      if (!apiKey) return;

      const response = await fetch('/api/cron/update-rates', {
        headers: { 'authorization': `Bearer ${apiKey}` }
      });

      if (!response.ok) throw new Error('Failed to refresh');

      await fetchRate();
      await fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchRate();
      fetchHistory();
      const interval = setInterval(() => {
        fetchRate();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
    // Intentionally omit fetchRate and fetchHistory from dependencies
    // They are defined inside useEffect to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  return (
    <div className="w-full space-y-6 p-6 text-foreground">
      {/* API Key Input */}
      <Card className="p-6">
        <div className="flex gap-4">
          <input
            type="password"
            placeholder="Enter API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            onClick={() => {
              fetchRate();
              fetchHistory();
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg"
          >
            Load
          </Button>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Card className="p-4 bg-danger/10 border border-danger/20">
          <p className="text-danger font-medium">Error: {error}</p>
        </Card>
      )}

      {!currentRate ? (
        <Card className="p-8 text-center text-muted-foreground">Enter API key and click Load to get started</Card>
      ) : currentRate ? (
        <>
          {/* Current Rate Display */}
          <Card className="p-8 bg-primary/5 border border-primary/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Current Rate
                </h2>
                <div className="text-5xl font-bold text-primary">
                  ₦{(currentRate.final_usd_ngn_rate ?? 0).toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  1 USD = {(currentRate.final_usd_ngn_rate ?? 0).toFixed(2)} NGN
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Updated: {new Date(currentRate.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 space-y-3 border border-border">
                <h3 className="font-semibold text-foreground mb-4">Rate Components & Calculation Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Baseline Rate:</span>
                    <span className="font-semibold text-foreground">
                      ₦{(currentRate.baseline_rate ?? 0).toFixed(2)}
                    </span>
                  </div>
                  {currentRate.baseline_sources && currentRate.baseline_sources.length > 0 && (
                    <div className="text-xs text-muted-foreground pl-2 border-l-2 border-border">
                      From {currentRate.baseline_sources.length} source{currentRate.baseline_sources.length !== 1 ? 's' : ''}: {currentRate.baseline_sources.join(', ')}
                    </div>
                  )}
                  {currentRate.crypto_implied_rate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Crypto Implied:</span>
                      <span className="font-semibold text-foreground">
                        ₦{(currentRate.crypto_implied_rate ?? 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {(currentRate.crypto_premium ?? 0) !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Crypto Premium:</span>
                      <span className={`font-semibold ${(currentRate.crypto_premium ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                        +₦{((currentRate.crypto_premium ?? 0).toFixed(2))}
                      </span>
                    </div>
                  )}
                  {(currentRate.liquidity_spread_raw ?? 0) !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Liquidity Spread:</span>
                      <div className="text-right">
                        <div className="font-semibold text-muted-foreground">Raw: ₦{(currentRate.liquidity_spread_raw ?? 0).toFixed(2)}</div>
                        <div className={`font-semibold ${(currentRate.liquidity_spread ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                          Clamped: +₦{((currentRate.liquidity_spread ?? 0).toFixed(2))}
                        </div>
                      </div>
                    </div>
                  )}
                  {(currentRate.desk_spread ?? 0) !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Desk Spread:</span>
                      <span className={`font-semibold ${(currentRate.desk_spread ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                        +₦{((currentRate.desk_spread ?? 0).toFixed(2))}
                      </span>
                    </div>
                  )}
                  {currentRate.otc_status && (
                    <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                      <span className="font-semibold">OTC Desk Status:</span> {currentRate.otc_status}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={refreshRate}
                disabled={refreshing}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-2 rounded-lg"
              >
                {refreshing ? 'Refreshing...' : 'Refresh Rate'}
              </Button>
              <p className="text-xs text-muted-foreground self-center">
                Method: {currentRate.calculation_method}
              </p>
            </div>
          </Card>

          {/* Chart */}
          {history.length > 0 && <Chart data={history} />}
        </>
      ) : null}
    </div>
  );
}
