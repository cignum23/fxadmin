import axios from 'axios';
import { ExternalRate } from '../types';

export async function fetchCryptoCompareRate(): Promise<ExternalRate> {
  try {
    const response = await axios.get(
      'https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=NGN',
      { timeout: 5000 }
    );

    const rate = Number(response.data.NGN);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`Invalid rate from CryptoCompare: ${rate}`);
    }

    return {
      source: 'CryptoCompare',
      usd_ngn_rate: rate,
      timestamp: new Date().toISOString(),
      status: 'success'
    };
  } catch (error) {
    console.error('CryptoCompare fetch failed:', error);
    throw new Error('CryptoCompare unavailable');
  }
}



export async function fetchCBNRate(): Promise<ExternalRate> {
  // Note: CBN doesn't have a direct API, would require web scraping
  // For now, using CoinGecko as alternative
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ngn'
    );

    const btcUsd = Number(response.data.bitcoin.usd);
    const btcNgn = Number(response.data.bitcoin.ngn);

    if (!Number.isFinite(btcUsd) || !Number.isFinite(btcNgn) || btcUsd <= 0) {
      throw new Error(`Invalid rates from CoinGecko: USD=${btcUsd}, NGN=${btcNgn}`);
    }

    const rate = btcNgn / btcUsd;
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`Invalid rate calculation from CoinGecko: ${rate}`);
    }

    return {
      source: 'CoinGecko_FX',
      usd_ngn_rate: rate,
      timestamp: new Date().toISOString(),
      status: 'success'
    };
  } catch (error) {
    console.error('CBN/CoinGecko fetch failed:', error);
    throw new Error('CBN rate unavailable');
  }
}

export async function fetchCoinMarketCapRate(): Promise<ExternalRate> {
  try {
    const apiKey = process.env.CMC_API_KEY;
    if (!apiKey) throw new Error('CoinMarketCap API key not configured');

    const response = await axios.get(
      'https://pro-api.coinmarketcap.com/v2/tools/price-conversion?amount=1&symbol=USD&convert=NGN',
      {
        headers: { 'X-CMC_PRO_API_KEY': apiKey },
        timeout: 5000
      }
    );

    const rate = response.data?.data?.quote?.NGN?.price;

    return {
      source: 'CoinMarketCap',
      usd_ngn_rate: Number(rate),
      timestamp: new Date().toISOString(),
      status: 'success'
    };
  } catch (error) {
    console.error('CoinMarketCap fetch failed:', error);
    throw new Error('CoinMarketCap unavailable');
  }
}

export async function fetchBinanceRate(): Promise<ExternalRate> {
  try {
    const response = await axios.get(
      'https://api.binance.com/api/v3/avgPrice?symbol=USDTNGN',
      { timeout: 5000 }
    );

    return {
      source: 'Binance_USDT',
      usd_ngn_rate: Number(response.data.price),
      timestamp: new Date().toISOString(),
      status: 'success'
    };
  } catch (error) {
    // Fallback: try USDC/NGN pair if USDT unavailable
    try {
      const response = await axios.get(
        'https://api.binance.com/api/v3/avgPrice?symbol=USDCNGN',
        { timeout: 5000 }
      );

      return {
        source: 'Binance_USDC',
        usd_ngn_rate: Number(response.data.price),
        timestamp: new Date().toISOString(),
        status: 'success'
      };
    } catch (fallbackError) {
      console.error('Binance USDT/USDC fetch failed:', fallbackError);
      throw new Error('Binance USDT/USDC unavailable');
    } // eslint-disable-line @typescript-eslint/no-unused-vars
  }
}

export async function fetchBinanceUSDCRate(): Promise<ExternalRate> {
  try {
    const response = await axios.get(
      'https://api.binance.com/api/v3/avgPrice?symbol=USDCNGN',
      { timeout: 5000 }
    );

    return {
      source: 'Binance_USDC',
      usd_ngn_rate: Number(response.data.price),
      timestamp: new Date().toISOString(),
      status: 'success'
    };
  } catch (error) {
    console.error('Binance USDC fetch failed:', error);
    throw new Error('Binance USDC unavailable');
  }
}

export async function collectExternalRates(): Promise<ExternalRate[]> {
  const sources = [
    fetchCryptoCompareRate(),
    fetchCoinMarketCapRate(),
    fetchBinanceRate(),
    fetchBinanceUSDCRate(),
    fetchCBNRate()
  ];

  const results = await Promise.allSettled(sources);

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<ExternalRate>).value);
}
