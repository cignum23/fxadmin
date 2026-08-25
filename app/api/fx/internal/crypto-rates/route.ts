//app\api\fx\internal\crypto-rates\route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function requireAdminSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: Request) {
  try {
    // middleware.ts already gates /api/fx/internal/*; this is defense in depth
    // for a route that writes the margin the whole rate engine is built on.
    const user = await requireAdminSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json() as Record<string, unknown>;

    // Validate required fields
    if (!data.usdt_ngn_sell && !data.btc_ngn_price) {
      return NextResponse.json(
        { error: 'At least one rate path must be provided' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('internal_crypto_rates')
      .insert({
        usdt_ngn_buy: data.usdt_ngn_buy,
        usdt_ngn_sell: data.usdt_ngn_sell,
        usdt_usd_rate: data.usdt_usd_rate || 1.0,
        btc_usdt_price: data.btc_usdt_price,
        btc_ngn_price: data.btc_ngn_price
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mirror the USDT/NGN buy rate into platform_rates as the "Internal
    // Engine" comparison row (previously done client-side from
    // RateManagement.tsx using the anon key).
    if (typeof data.usdt_ngn_buy === 'number') {
      const { error: platformRatesError } = await supabaseAdmin
        .from('platform_rates')
        .upsert(
          {
            platform_id: 'internal',
            platform_name: 'Internal Engine',
            rate_usd: data.usdt_ngn_buy,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'platform_id' }
        );

      if (platformRatesError) {
        console.warn('platform_rates upsert warning:', platformRatesError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Crypto rates updated successfully'
    });
  } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    return NextResponse.json(
      { error: 'Failed to update crypto rates' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await requireAdminSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('internal_crypto_rates')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    return NextResponse.json(
      { error: 'Failed to fetch crypto rates' },
      { status: 500 }
    );
  }
}
