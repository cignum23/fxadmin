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
    if (typeof data.usd_cost !== 'number' || typeof data.desk_spread !== 'number') {
      return NextResponse.json(
        { error: 'usd_cost and desk_spread are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('otc_desk_rates')
      .insert({
        usd_cost: data.usd_cost,
        ngn_cost: data.ngn_cost || 0,
        desk_spread: data.desk_spread,
        updated_by: data.updated_by || 'system'
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'OTC desk rates updated successfully'
    });
  } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    return NextResponse.json(
      { error: 'Failed to update OTC desk rates' },
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
      .from('otc_desk_rates')
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
      { error: 'Failed to fetch OTC desk rates' },
      { status: 500 }
    );
  }
}
