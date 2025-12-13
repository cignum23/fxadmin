//app\api\fx\internal\crypto-rates\route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyInternalApiKey } from '@/lib/fx-engine/utils/auth';

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!verifyInternalApiKey(apiKey)) {
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

    const { error } = await supabase
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

export async function GET(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!verifyInternalApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
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
