import { supabase } from '@/lib/supabaseClient';
import { logRateCalculation } from '../utils/logger';
import { OTCDeskData } from '../types';

export async function fetchOTCDeskData(): Promise<OTCDeskData> {
  try {
    const { data, error } = await supabase
      .from('otc_desk_rates')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      await logRateCalculation('warning', 'No OTC desk data available, using defaults');
      return {
        usd_cost: 0,
        ngn_cost: 0,
        desk_spread: 0
      };
    }

    return data as OTCDeskData;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await logRateCalculation('warning', 'Failed to fetch OTC desk data', { error: errorMessage });
    return {
      usd_cost: 0,
      ngn_cost: 0,
      desk_spread: 0
    };
  }
}

export function calculateLiquiditySpread(
  usdCost: number,
  baselineRate: number
): number {
  const rawSpread = usdCost - baselineRate;

  const minSpread = Number(process.env.LIQUIDITY_SPREAD_MIN) || -10;
  const maxSpread = Number(process.env.LIQUIDITY_SPREAD_MAX) || 50;

  const clampedSpread = Math.max(minSpread, Math.min(maxSpread, rawSpread));

  console.log(`Liquidity spread: raw=${rawSpread}, clamped=${clampedSpread}`);

  return Number(clampedSpread.toFixed(2));
}
