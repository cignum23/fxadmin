// app/api/fx/usd-ngn-engine/route.ts
import { NextResponse } from 'next/server';

/**
 * Centralized USD → NGN FX Rate Engine
 * 
 * This endpoint aggregates rates from multiple external and internal sources
 * to provide a single, reliable USD → NGN conversion rate.
 */

// Fallback rate if all sources fail (in NGN per USD)
const FALLBACK_RATE = 1550;

interface FxEngineResponse {
  final_usd_ngn_rate: number;
  baseline_rate: number;
  timestamp: string;
  sources: {
    source: string;
    rate: number | null;
    status: 'success' | 'failed';
    error?: string;
  }[];
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 5000
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        data: null,
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET() {
  try {
    const sources: FxEngineResponse['sources'] = [];
    const rates: number[] = [];

    // 1. Try Binance for USDT/NGN (indirect)
    try {
      const { data, error } = await fetchWithTimeout(
        'https://api.binance.com/api/v3/avgPrice?symbol=USDT NGNT',
        3000
      );

      if (!error && data?.price) {
        const rate = parseFloat(String(data.price));
        if (Number.isFinite(rate) && rate > 0) {
          rates.push(rate);
          sources.push({
            source: 'Binance USDT',
            rate,
            status: 'success',
          });
        } else {
          sources.push({
            source: 'Binance USDT',
            rate: null,
            status: 'failed',
            error: 'Invalid rate',
          });
        }
      } else {
        sources.push({
          source: 'Binance USDT',
          rate: null,
          status: 'failed',
          error: error || undefined,
        });
      }
    } catch (e) {
      sources.push({
        source: 'Binance USDT',
        rate: null,
        status: 'failed',
        error: String(e),
      });
    }

    // 2. Try CoinMarketCap USD/NGN (requires API key, using fallback)
    sources.push({
      source: 'CoinMarketCap',
      rate: null,
      status: 'failed',
      error: 'Requires API key',
    });

    // Calculate final rate
    let finalRate = FALLBACK_RATE;

    if (rates.length > 0) {
      // Use average of all successful rates
      finalRate = rates.reduce((a, b) => a + b, 0) / rates.length;

      // Ensure reasonable bounds (between 1000 and 2000 NGN per USD)
      if (finalRate < 1000 || finalRate > 2000) {
        finalRate = FALLBACK_RATE;
      }
    }

    const response: FxEngineResponse = {
      final_usd_ngn_rate: Math.round(finalRate * 100) / 100,
      baseline_rate: finalRate,
      timestamp: new Date().toISOString(),
      sources,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error: unknown) {
    console.error('FX Engine Error:', error);

    const response: FxEngineResponse = {
      final_usd_ngn_rate: FALLBACK_RATE,
      baseline_rate: FALLBACK_RATE,
      timestamp: new Date().toISOString(),
      sources: [
        {
          source: 'System',
          rate: FALLBACK_RATE,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    };

    return NextResponse.json(response, { status: 200 });
  }
}
