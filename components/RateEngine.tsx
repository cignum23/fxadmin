'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Dynamically import chart to prevent hydration issues
const Chart = dynamic(() => import('./RateChart'), { 
  ssr: false, 
  loading: () => <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">Loading chart...</div> 
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
    <div className="w-full space-y-6 p-6 text-black">
      {/* API Key Input */}
      <Card className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 text-black">
        <div className="flex gap-4">
          <input
            type="password"
            placeholder="Enter API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-black"
          />
          <Button
            onClick={() => {
              fetchRate();
              fetchHistory();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Load
          </Button>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <p className="text-red-700 font-medium">Error: {error}</p>
        </Card>
      )}

      {!currentRate ? (
        <Card className="p-8 text-center text-gray-500">Enter API key and click Load to get started</Card>
      ) : currentRate ? (
        <>
          {/* Current Rate Display */}
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Current Rate
                </h2>
                <div className="text-5xl font-bold text-blue-600">
                  ₦{(currentRate.final_usd_ngn_rate ?? 0).toFixed(2)}
                </div>
                <p className="text-sm text-gray-500">
                  1 USD = {(currentRate.final_usd_ngn_rate ?? 0).toFixed(2)} NGN
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Updated: {new Date(currentRate.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 space-y-3">
                <h3 className="font-semibold text-gray-700 mb-4">Rate Components & Calculation Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Baseline Rate:</span>
                    <span className="font-semibold text-gray-800">
                      ₦{(currentRate.baseline_rate ?? 0).toFixed(2)}
                    </span>
                  </div>
                  {currentRate.baseline_sources && currentRate.baseline_sources.length > 0 && (
                    <div className="text-xs text-gray-500 pl-2 border-l-2 border-gray-300">
                      From {currentRate.baseline_sources.length} source{currentRate.baseline_sources.length !== 1 ? 's' : ''}: {currentRate.baseline_sources.join(', ')}
                    </div>
                  )}
                  {currentRate.crypto_implied_rate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Crypto Implied:</span>
                      <span className="font-semibold text-gray-800">
                        ₦{(currentRate.crypto_implied_rate ?? 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {(currentRate.crypto_premium ?? 0) !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Crypto Premium:</span>
                      <span className={`font-semibold ${(currentRate.crypto_premium ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        +₦{((currentRate.crypto_premium ?? 0).toFixed(2))}
                      </span>
                    </div>
                  )}
                  {(currentRate.liquidity_spread_raw ?? 0) !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Liquidity Spread:</span>
                      <div className="text-right">
                        <div className="font-semibold text-gray-600">Raw: ₦{(currentRate.liquidity_spread_raw ?? 0).toFixed(2)}</div>
                        <div className={`font-semibold ${(currentRate.liquidity_spread ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Clamped: +₦{((currentRate.liquidity_spread ?? 0).toFixed(2))}
                        </div>
                      </div>
                    </div>
                  )}
                  {(currentRate.desk_spread ?? 0) !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Desk Spread:</span>
                      <span className={`font-semibold ${(currentRate.desk_spread ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        +₦{((currentRate.desk_spread ?? 0).toFixed(2))}
                      </span>
                    </div>
                  )}
                  {currentRate.otc_status && (
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
              >
                {refreshing ? 'Refreshing...' : 'Refresh Rate'}
              </Button>
              <p className="text-xs text-gray-500 self-center">
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
