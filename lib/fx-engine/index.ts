import { collectExternalRates } from './collectors/external-market';
import { calculateBaselineRate } from './calculators/baseline-rate';
import { calculateCryptoImpliedRate } from './collectors/crypto-implied';
import { fetchOTCDeskData, calculateLiquiditySpread } from './collectors/otc-liquidity';
import { calculateFinalRate } from './calculators/final-rate';
import { getFallbackRate } from './utils/fallback';
import { logRateCalculation } from './utils/logger';
import { FinalRate, ExternalRate } from './types';
import { supabase } from '@/lib/supabaseClient';

// Save external rates to database for persistence and fallback
async function saveExternalRatesToDatabase(rates: ExternalRate[]): Promise<void> {
  try {
    const startTime = Date.now();
    const externalRateRecords = rates.map(rate => ({
      source_name: rate.source,
      usd_ngn_rate: rate.usd_ngn_rate,
      status: rate.status,
      response_time_ms: null, // Could be calculated from timestamp
      raw_data: { source: rate.source, timestamp: rate.timestamp },
      timestamp: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('external_rate_sources')
      .insert(externalRateRecords);

    if (error) {
      console.error('Failed to save external rates to DB:', error);
    } else {
      console.log(`Saved ${externalRateRecords.length} external rates to database in ${Date.now() - startTime}ms`);
    }
  } catch (err) {
    console.error('Error saving external rates:', err);
  }
}

export async function calculateFinalFxRate(): Promise<FinalRate> {
  try {
    await logRateCalculation('info', 'Starting FX rate calculation');

    // Step 1: Collect external rates
    const externalRates = await collectExternalRates();

    // Step 1.5: Save external rates to database for fallback
    if (externalRates.length > 0) {
      await saveExternalRatesToDatabase(externalRates);
    }

    if (externalRates.length === 0) {
      await logRateCalculation('warning', 'No external rates available, using fallback');
      const fallbackRate = await getFallbackRate();

      return {
        baseline_rate: fallbackRate,
        crypto_implied_rate: null,
        crypto_premium: 0,
        liquidity_spread: 0,
        desk_spread: 0,
        final_usd_ngn_rate: fallbackRate,
        timestamp: new Date().toISOString(),
        calculation_method: 'fallback',
        baseline_sources: [],
        otc_status: 'unavailable'
      };
    }

    // Step 2: Calculate baseline
    let baselineRate: number;
    let baselineSources: string[] = [];
    try {
      baselineRate = calculateBaselineRate(externalRates);
      // Extract source names from externalRates
      const validRates = externalRates.filter(r => 
        Number.isFinite(r.usd_ngn_rate) && r.usd_ngn_rate > 0
      );
      baselineSources = validRates.map(r => r.source);
    } catch (error) {
      await logRateCalculation('warning', 'Baseline rate calculation failed, using fallback', { error });
      const fallbackRate = await getFallbackRate();
      
      return {
        baseline_rate: fallbackRate,
        crypto_implied_rate: null,
        crypto_premium: 0,
        liquidity_spread: 0,
        desk_spread: 0,
        final_usd_ngn_rate: fallbackRate,
        timestamp: new Date().toISOString(),
        calculation_method: 'fallback',
        baseline_sources: [],
        otc_status: 'calculation_failed'
      };
    }

    // Step 3: Calculate crypto-implied rate (with error handling)
    let cryptoImpliedRate: number | null = null;
    try {
      const cryptoRate = await calculateCryptoImpliedRate();
      cryptoImpliedRate = cryptoRate.rate;
    } catch (error) {
      await logRateCalculation('warning', 'Crypto-implied rate calculation failed', { error });
    }

    // Step 4: Get OTC desk data
    let otcStatus = 'available';
    const otcData = await fetchOTCDeskData();
    
    if (!otcData.usd_cost || otcData.usd_cost === 0) {
      otcStatus = 'using defaults';
    }
    
    const liquiditySpreadRaw = calculateLiquiditySpread(otcData.usd_cost, baselineRate);
    const liquiditySpread = liquiditySpreadRaw;

    // Step 5: Calculate final rate
    const finalRate = calculateFinalRate({
      baseline: baselineRate,
      cryptoImplied: cryptoImpliedRate,
      liquiditySpread,
      deskSpread: otcData.desk_spread
    });

    // Add calculation metadata
    finalRate.baseline_sources = baselineSources;
    finalRate.otc_status = otcStatus;
    finalRate.liquidity_spread_raw = liquiditySpreadRaw;

    // Validate final rate
    if (!Number.isFinite(finalRate.final_usd_ngn_rate) || finalRate.final_usd_ngn_rate <= 0) {
      await logRateCalculation('warning', 'Final rate calculation produced invalid result', { finalRate });
      const fallbackRate = await getFallbackRate();
      
      return {
        baseline_rate: fallbackRate,
        crypto_implied_rate: null,
        crypto_premium: 0,
        liquidity_spread: 0,
        desk_spread: 0,
        final_usd_ngn_rate: fallbackRate,
        timestamp: new Date().toISOString(),
        calculation_method: 'fallback',
        baseline_sources: [],
        otc_status: 'validation_failed'
      };
    }

    // Step 6: Store in database with raw sources
    const startTime = Date.now();
    const { raw_sources: _unused, ...rateData } = finalRate;
    const rateRecord = {
      ...rateData,
      raw_sources: externalRates
    };

    const { error } = await supabase
      .from('fx_rate_calculations')
      .insert(rateRecord);

    if (error) {
      console.error('Failed to save FX calculation to DB:', error);
    } else {
      console.log(`Saved FX rate calculation to database in ${Date.now() - startTime}ms`);
    }

    await logRateCalculation('info', 'FX rate calculation completed', { finalRate });

    return finalRate;
  } catch (error) {
    await logRateCalculation('error', 'FX rate calculation failed critically', { error });
    throw error;
  }
}

export async function calculateAndStoreFxRate(): Promise<FinalRate> {
  return calculateFinalFxRate();
}

export * from './types';
