import { NextResponse } from 'next/server';
import { calculateFinalFxRate } from '@/lib/fx-engine';
import { verifyApiKey, verifyIPWhitelist } from '@/lib/fx-engine/utils/auth';
import { checkRateLimit } from '@/lib/fx-engine/utils/rate-limiter';

export async function GET(request: Request) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (!verifyApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    // Verify IP whitelist (optional, comment out if not needed)
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!verifyIPWhitelist(ip)) {
      return NextResponse.json(
        { error: 'Forbidden - IP not whitelisted' },
        { status: 403 }
      );
    }

    // Check rate limit
    const allowed = await checkRateLimit();
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
