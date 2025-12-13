import { CryptoRate, InternalCryptoData } from '../types';
import { supabase } from '@/lib/supabaseClient';

async function fetchInternalCryptoRates(): Promise<InternalCryptoData> {
  const { data, error } = await supabase
    .from('internal_crypto_rates')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('No internal crypto rates available');
  }

  return data;
}

export async function calculateCryptoImpliedRate(): Promise<CryptoRate> {
  try {
    const internal = await fetchInternalCryptoRates();

    // Primary path: USDT
    if (internal.usdt_ngn_sell && internal.usdt_usd_rate) {
      const rate = internal.usdt_ngn_sell / internal.usdt_usd_rate;
      console.log(`Crypto-implied rate (USDT path): ${rate}`);

      return {
        rate: Number(rate.toFixed(2)),
        method: 'usdt_primary',
        timestamp: new Date().toISOString()
      };
    }

    // Fallback: BTC path
    if (internal.btc_ngn_price && internal.btc_usdt_price) {
      const rate = internal.btc_ngn_price / internal.btc_usdt_price;
      console.log(`Crypto-implied rate (BTC fallback): ${rate}`);

      return {
        rate: Number(rate.toFixed(2)),
        method: 'btc_fallback',
        timestamp: new Date().toISOString()
      };
    }

    throw new Error('No valid crypto rate path available');
  } catch (error) {
    console.error('Crypto-implied rate calculation failed:', error);
    throw error;
  }
}