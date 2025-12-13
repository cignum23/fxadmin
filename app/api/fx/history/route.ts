import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyApiKey } from '@/lib/fx-engine/utils/auth';

export async function GET(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!verifyApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 100;
    const hours = Number(searchParams.get('hours')) || 24;

    const since = new Date();
    since.setHours(since.getHours() - hours);

    const { data, error } = await supabase
      .from('fx_rate_calculations')
      .select('*')
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      count: data?.length || 0,
      period: `${hours}h`
    });
  } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
