import { NextResponse } from 'next/server';
import { calculateFinalFxRate } from '@/lib/fx-engine';
import { verifyRateReadKeyOrSession, verifyIPWhitelist } from '@/lib/fx-engine/utils/auth';
import { checkRateLimit, getClientIp } from '@/lib/fx-engine/utils/rate-limiter';

export async function GET(request: Request) {
  try {
    // Verify a rate-read key, an internal key, or an active dashboard session
    if (!(await verifyRateReadKeyOrSession(request))) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key or session' },
        { status: 401 }
      );
    }

    // Verify IP whitelist (optional, comment out if not needed)
    const ip = getClientIp(request);
    if (!verifyIPWhitelist(ip)) {
      return NextResponse.json(
        { error: 'Forbidden - IP not whitelisted' },
        { status: 403 }
      );
    }

    // Check rate limit (per-caller, not global)
    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Calculate rate
    const rate = await calculateFinalFxRate();

    return NextResponse.json(rate, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Rate calculation error:', error);
    return NextResponse.json(
      {
        error: 'Rate calculation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
