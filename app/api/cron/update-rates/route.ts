import { NextResponse } from 'next/server';
import { calculateAndStoreFxRate } from '@/lib/fx-engine';

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting scheduled rate update...');

    const rate = await calculateAndStoreFxRate();

    console.log('[CRON] Rate update completed:', rate.final_usd_ngn_rate);

    return NextResponse.json({
      success: true,
      rate: rate.final_usd_ngn_rate,
      timestamp: rate.timestamp
    });
  } catch (error) {
    console.error('[CRON] Rate update failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
