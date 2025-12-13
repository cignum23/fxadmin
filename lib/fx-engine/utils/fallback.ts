import { supabase } from '@/lib/supabaseClient';
import { calculateCryptoImpliedRate } from '../collectors/crypto-implied';

async function getCachedRate(): Promise<Record<string, unknown> | null> {
  try {
    const { data } = await supabase
      .from('fx_rate_calculations')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    return data as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

function isRecent(timestamp: string, minutesThreshold: number): boolean {
  const now = new Date().getTime();
  const then = new Date(timestamp).getTime();
  const diffMinutes = (now - then) / 1000 / 60;

  return diffMinutes <= minutesThreshold;
}

async function getLastBaselineRate(): Promise<number | null> {
  try {
    const { data } = await supabase
      .from('fx_rate_calculations')
      .select('baseline_rate')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    return data && typeof (data as Record<string, unknown>).baseline_rate === 'number'
      ? (data as Record<string, unknown>).baseline_rate as number
      : null;
  } catch {
    return null;
  }
}

async function triggerAdminAlert(message: string): Promise<void> {
  console.error('ADMIN ALERT:', message);

  // Store in logs
  try {
    await supabase.from('rate_calculation_logs').insert({
      level: 'error',
      message,
      context: { alert_type: 'failsafe_triggered' }
    });
  } catch (err) {
    console.error('Failed to insert alert log:', err);
  }

  // TODO: Send email/SMS alert to admin
}

export async function getFallbackRate(): Promise<number> {
  console.warn('Attempting fallback rate retrieval...');

  // 1. Try cached final rate (last 5 minutes)
  const cached = await getCachedRate();
  if (
    cached &&
    typeof (cached as Record<string, unknown>).timestamp === 'string' &&
    isRecent((cached as Record<string, unknown>).timestamp as string, 5)
  ) {
    const rate = (cached as Record<string, unknown>).final_usd_ngn_rate;
    console.log('Using cached rate:', rate);
    return rate as number;
  }

  // 2. Try crypto-implied rate
  try {
    const cryptoRate = await calculateCryptoImpliedRate();
    console.log('Using crypto-implied fallback:', cryptoRate.rate);
    return cryptoRate.rate;
  } catch (error) {
    console.error('Crypto-implied fallback failed:', error);
  }

  // 3. Last known baseline rate
  const lastBaseline = await getLastBaselineRate();
  if (lastBaseline) {
    console.log('Using last known baseline:', lastBaseline);
    return lastBaseline;
  }

  // 4. Fail-safe alert
  await triggerAdminAlert('All FX rate sources failed - no fallback available');
  throw new Error('No fallback rate available');
}
