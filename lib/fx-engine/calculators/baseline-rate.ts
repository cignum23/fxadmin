import { ExternalRate } from '../types';

export function calculateBaselineRate(rates: ExternalRate[]): number {
  if (rates.length === 0) {
    throw new Error('No external rates available for baseline calculation');
  }

  // Filter out invalid rates (NaN, Infinity, non-positive numbers)
  const validRates = rates.filter(r => 
    Number.isFinite(r.usd_ngn_rate) && r.usd_ngn_rate > 0
  );

  if (validRates.length === 0) {
    throw new Error('No valid rates available - all rates are NaN or invalid');
  }

  // Prioritize USDT and USDC rates for accurate USD conversion
  const stablecoinRates = validRates.filter(r => 
    r.source.toLowerCase().includes('usdt') || 
    r.source.toLowerCase().includes('usdc')
  );

  const ratesForCalculation = stablecoinRates.length > 0 ? stablecoinRates : validRates;

  // If we have stablecoin rates, use weighted average (prefer them more heavily)
  if (stablecoinRates.length > 0 && validRates.length > stablecoinRates.length) {
    // Weight stablecoin rates 2x more than other sources for stability
    const stablecoinSum = stablecoinRates.reduce((acc, r) => acc + r.usd_ngn_rate, 0);
    const stablecoinAvg = stablecoinSum / stablecoinRates.length;
    
    const otherRates = validRates.filter(r => !stablecoinRates.includes(r));
    const otherSum = otherRates.reduce((acc, r) => acc + r.usd_ngn_rate, 0);
    const otherAvg = otherSum / otherRates.length;

    // Weighted: 66% stablecoin, 34% other sources
    const weightedRate = (stablecoinAvg * 2 + otherAvg) / 3;
    
    console.log(`Baseline rate (weighted): Stablecoin(${stablecoinAvg.toFixed(2)}) 66% + Other(${otherAvg.toFixed(2)}) 34% = ${weightedRate.toFixed(2)}`);
    return Number(weightedRate.toFixed(2));
  }

  // Fallback: simple average if only one type available
  const sum = ratesForCalculation.reduce((acc, r) => acc + r.usd_ngn_rate, 0);
  const average = sum / ratesForCalculation.length;

  if (!Number.isFinite(average) || average <= 0) {
    throw new Error(`Calculated baseline rate is invalid: ${average}`);
  }

  console.log(`Baseline rate calculated from ${ratesForCalculation.length} sources (${ratesForCalculation.map(r => r.source).join(', ')}): ${average.toFixed(2)}`);

  return Number(average.toFixed(2));
}