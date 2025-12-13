import { RateComponents, FinalRate } from '../types';

export function calculateFinalRate(components: RateComponents): FinalRate {
  const { baseline, cryptoImplied, liquiditySpread, deskSpread } = components;

  const cryptoPremium = cryptoImplied ? Number((cryptoImplied - baseline).toFixed(2)) : 0;

  const finalRate = baseline + liquiditySpread + cryptoPremium + deskSpread;

  console.log('Final rate calculation:', {
    baseline,
    cryptoPremium,
    liquiditySpread,
    deskSpread,
    final: finalRate
  });

  return {
    baseline_rate: baseline,
    crypto_implied_rate: cryptoImplied,
    crypto_premium: cryptoPremium,
    liquidity_spread: liquiditySpread,
    desk_spread: deskSpread,
    final_usd_ngn_rate: Number(finalRate.toFixed(2)),
    timestamp: new Date().toISOString(),
    calculation_method: cryptoImplied ? 'full_3layer' : 'baseline_liquidity_only'
  };
}
