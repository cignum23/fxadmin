export interface ExternalRate {
  source: string;
  usd_ngn_rate: number;
  timestamp: string;
  status: 'success' | 'failed' | 'timeout';
}

export interface CryptoRate {
  rate: number;
  method: 'usdt_primary' | 'btc_fallback';
  timestamp: string;
}

export interface InternalCryptoData {
  usdt_ngn_buy?: number;
  usdt_ngn_sell?: number;
  usdt_usd_rate?: number;
  btc_usdt_price?: number;
  btc_ngn_price?: number;
}

export interface OTCDeskData {
  usd_cost: number;
  ngn_cost: number;
  desk_spread: number;
}

export interface RateComponents {
  baseline: number;
  cryptoImplied: number | null;
  liquiditySpread: number;
  deskSpread: number;
}

export interface FinalRate {
  baseline_rate: number;
  crypto_implied_rate: number | null;
  crypto_premium: number;
  liquidity_spread: number;
  desk_spread: number;
  final_usd_ngn_rate: number;
  timestamp: string;
  raw_sources?: ExternalRate[];
  calculation_method?: string;
  // Calculation details for display
  baseline_sources?: string[];
  otc_status?: string;
  liquidity_spread_raw?: number;
}
