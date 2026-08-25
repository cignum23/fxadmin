// app/api/fx/rate-fallback/route.ts
// Fallback endpoint - returns latest cached FX rate from database when APIs fail
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyApiKey, verifyRateReadKey } from '@/lib/fx-engine/utils/auth';
import { checkRateLimit, getClientIp } from '@/lib/fx-engine/utils/rate-limiter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ""
);

export async function GET(request: Request) {
  const apiKey = request.headers.get('x-api-key');
  // Read-only endpoint, same two key classes as /api/fx/rate and /api/fx/history.
  if (!verifyRateReadKey(apiKey) && !verifyApiKey(apiKey)) {
    return NextResponse.json({ error: 'Unauthorized - Invalid API key' }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    // Fetch latest FX rate from the latest_fx_rate view or fx_rate_calculations table
    const { data, error } = await supabase
      .from('fx_rate_calculations')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'No cached rate available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...data,
      cached: true,
      source: 'database'
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Rate fallback error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cached rate' },
      { status: 500 }
    );
  }
}
