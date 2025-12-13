// app/api/fx/rate-fallback/route.ts
// Fallback endpoint - returns latest cached FX rate from database when APIs fail
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ""
);

export async function GET() {
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
