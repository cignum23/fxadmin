import { supabase } from '@/lib/supabaseClient';

export async function logRateCalculation(
  level: 'info' | 'warning' | 'error',
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('rate_calculation_logs').insert({
      level,
      message,
      context: context || {}
    });
  } catch (err) {
    console.error('Failed to log to database:', err);
  }

  console.log(`[${level.toUpperCase()}] ${message}`, context);
}
