// app/api/fx/usd-ngn-engine/route.ts
import { NextResponse } from 'next/server';

/**
 * Deprecated: this was a second, parallel USD->NGN engine that duplicated
 * lib/fx-engine (the real internal engine). Its Binance symbol was wrong
 * ('USDT NGNT') and its CoinMarketCap source was hardcoded to fail, so it
 * always silently served a hardcoded 1550 fallback. Use /api/fx/rate instead.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Gone',
      message: 'This endpoint is deprecated and no longer computes a rate. Use /api/fx/rate.',
    },
    { status: 410 }
  );
}
