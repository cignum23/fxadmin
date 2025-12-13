'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''
);

export function RateManagement() {
  const [internalApiKeys, setInternalApiKeys] = useState<string[]>([]);
  const [selectedKeyIndex, setSelectedKeyIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'crypto' | 'otc'>('crypto');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [baselineRateInfo, setBaselineRateInfo] = useState<{
    usdt_ngn_buy: number | null;
    usdt_ngn_sell: number | null;
    usdt_usd_rate: number | null;
    btc_usdt_price: number | null;
    btc_ngn_price: number | null;
    timestamp: string;
  } | null>(null);

  // Parse internal API keys from environment
  useEffect(() => {
    const keysEnv = process.env.NEXT_PUBLIC_INTERNAL_API_KEYS;
    if (keysEnv) {
      const keys = keysEnv.split(',').map(key => key.trim());
      setInternalApiKeys(keys);
    }
  }, []);

  // Fetch internal crypto rates
  useEffect(() => {
    const fetchInternalRates = async () => {
      try {
        const { data, error } = await supabase
          .from('internal_crypto_rates')
          .select('usdt_ngn_buy, usdt_ngn_sell, usdt_usd_rate, btc_usdt_price, btc_ngn_price, timestamp')
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.warn('Failed to fetch internal rates:', error);
          setBaselineRateInfo(null);
          return;
        }

        if (data) {
          setBaselineRateInfo({
            usdt_ngn_buy: data.usdt_ngn_buy,
            usdt_ngn_sell: data.usdt_ngn_sell,
            usdt_usd_rate: data.usdt_usd_rate,
            btc_usdt_price: data.btc_usdt_price,
            btc_ngn_price: data.btc_ngn_price,
            timestamp: data.timestamp
          });
        }
      } catch (err) {
        console.error('Failed to fetch internal rates:', err);
      }
    };

    fetchInternalRates();
    const interval = setInterval(fetchInternalRates, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const apiKey = internalApiKeys[selectedKeyIndex] || '';

  const maskKey = (key: string): string => {
    if (key.length <= 10) return key;
    return key.substring(0, 10) + 'X'.repeat(key.length - 10);
  };

  const copyToClipboard = (key: string, index: number) => {
    navigator.clipboard.writeText(key);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Crypto Rates Form
  const [cryptoForm, setCryptoForm] = useState({
    usdt_ngn_sell: '',
    usdt_ngn_buy: '',
    usdt_usd_rate: '1.0',
    btc_usdt_price: '',
    btc_ngn_price: ''
  });

  // OTC Desk Form
  const [otcForm, setOtcForm] = useState({
    usd_cost: '',
    ngn_cost: '',
    desk_spread: ''
  });

  const handleCryptoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!apiKey) {
        throw new Error('Internal API key required');
      }

      const payload = {
        usdt_ngn_sell: cryptoForm.usdt_ngn_sell ? parseFloat(cryptoForm.usdt_ngn_sell) : null,
        usdt_ngn_buy: cryptoForm.usdt_ngn_buy ? parseFloat(cryptoForm.usdt_ngn_buy) : null,
        usdt_usd_rate: parseFloat(cryptoForm.usdt_usd_rate) || 1.0,
        btc_usdt_price: cryptoForm.btc_usdt_price ? parseFloat(cryptoForm.btc_usdt_price) : null,
        btc_ngn_price: cryptoForm.btc_ngn_price ? parseFloat(cryptoForm.btc_ngn_price) : null
      };

      const response = await fetch('/api/fx/internal/crypto-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update crypto rates');
      }

      // Also save to Supabase for use in calculator
      const { error: supabaseError } = await supabase
        .from('internal_crypto_rates')
        .insert({
          usdt_ngn_buy: payload.usdt_ngn_buy,
          usdt_ngn_sell: payload.usdt_ngn_sell,
          usdt_usd_rate: payload.usdt_usd_rate,
          btc_usdt_price: payload.btc_usdt_price,
          btc_ngn_price: payload.btc_ngn_price
        });

      if (supabaseError) {
        console.warn('Supabase internal_crypto_rates save warning:', supabaseError);
      }

      // Also save to platform_rates table with internal engine rate
      // Use USDT/NGN buy rate as the USD/NGN rate for the internal engine
      if (payload.usdt_ngn_buy) {
        const { error: platformRatesError } = await supabase
          .from('platform_rates')
          .upsert({
            platform_id: 'internal',
            platform_name: 'Internal Engine',
            rate_usd: payload.usdt_ngn_buy,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'platform_id',
          });

        if (platformRatesError) {
          console.warn('Platform rates save warning:', platformRatesError);
        }
      }

      setMessage({ type: 'success', text: 'Crypto rates updated successfully' });
      setCryptoForm({
        usdt_ngn_sell: '',
        usdt_ngn_buy: '',
        usdt_usd_rate: '1.0',
        btc_usdt_price: '',
        btc_ngn_price: ''
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Update failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!apiKey) {
        throw new Error('Internal API key required');
      }

      const payload = {
        usd_cost: parseFloat(otcForm.usd_cost),
        ngn_cost: parseFloat(otcForm.ngn_cost),
        desk_spread: parseFloat(otcForm.desk_spread)
      };

      const response = await fetch('/api/fx/internal/otc-desk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update OTC desk');
      }

      setMessage({ type: 'success', text: 'OTC desk rates updated successfully' });
      setOtcForm({ usd_cost: '', ngn_cost: '', desk_spread: '' });
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Update failed'
        });
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="space-y-6">
        {/* Current Internal Crypto Rates */}
        {baselineRateInfo && (
          <Card className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-600">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Current Internal Crypto Rates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {baselineRateInfo.usdt_ngn_buy && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">USDT/NGN Buy Rate</p>
                  <p className="text-2xl font-bold text-emerald-600">₦{baselineRateInfo.usdt_ngn_buy.toFixed(2)}</p>
                </div>
              )}
              {baselineRateInfo.usdt_ngn_sell && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">USDT/NGN Sell Rate</p>
                  <p className="text-2xl font-bold text-emerald-600">₦{baselineRateInfo.usdt_ngn_sell.toFixed(2)}</p>
                </div>
              )}
              {baselineRateInfo.usdt_usd_rate && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">USDT/USD Rate</p>
                  <p className="text-2xl font-bold text-emerald-600">${baselineRateInfo.usdt_usd_rate.toFixed(4)}</p>
                </div>
              )}
              {baselineRateInfo.btc_usdt_price && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">BTC/USDT Price</p>
                  <p className="text-2xl font-bold text-emerald-600">${baselineRateInfo.btc_usdt_price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                </div>
              )}
              {baselineRateInfo.btc_ngn_price && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">BTC/NGN Price</p>
                  <p className="text-2xl font-bold text-emerald-600">₦{baselineRateInfo.btc_ngn_price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 pt-4 border-t border-emerald-200">
              Last updated: {new Date(baselineRateInfo.timestamp).toLocaleString()}
            </p>
          </Card>
        )}

      {/* API Keys Display */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Internal API Keys</h3>
        <div className="space-y-3">
          {internalApiKeys.length === 0 ? (
            <p className="text-sm text-gray-600">No API keys configured</p>
          ) : (
            internalApiKeys.map((key, index) => (
              <div key={index} className="flex items-center justify-between gap-2 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Key {index + 1}</p>
                  <code className="text-sm text-gray-800 font-mono break-all">{maskKey(key)}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(key, index)}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex-shrink-0"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check size={16} />
                      <span className="text-xs">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span className="text-xs">Copy</span>
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block text-xs font-semibold text-gray-700 mb-2">Select API Key to Use</label>
          <select
            value={selectedKeyIndex}
            onChange={(e) => setSelectedKeyIndex(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
          >
            {internalApiKeys.map((_, index) => (
              <option key={index} value={index}>
                Key {index + 1}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Message Alert */}
      {message && (
        <Card className={`p-4 ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </p>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('crypto')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'crypto'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Crypto Rates
        </button>
        <button
          onClick={() => setActiveTab('otc')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'otc'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          OTC Desk
        </button>
      </div>

      {/* Crypto Rates Form */}
      {activeTab === 'crypto' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Update Internal Crypto Rates</h3>
          <form onSubmit={handleCryptoSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USDT/NGN Sell Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 1550.50"
                  value={cryptoForm.usdt_ngn_sell}
                  onChange={(e) =>
                    setCryptoForm({ ...cryptoForm, usdt_ngn_sell: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USDT/NGN Buy Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 1545.50"
                  value={cryptoForm.usdt_ngn_buy}
                  onChange={(e) =>
                    setCryptoForm({ ...cryptoForm, usdt_ngn_buy: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USDT/USD Rate
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={cryptoForm.usdt_usd_rate}
                  onChange={(e) =>
                    setCryptoForm({ ...cryptoForm, usdt_usd_rate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BTC/USDT Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 45000"
                  value={cryptoForm.btc_usdt_price}
                  onChange={(e) =>
                    setCryptoForm({ ...cryptoForm, btc_usdt_price: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BTC/NGN Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 70000000"
                  value={cryptoForm.btc_ngn_price}
                  onChange={(e) =>
                    setCryptoForm({ ...cryptoForm, btc_ngn_price: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
            >
              {loading ? 'Updating...' : 'Update Crypto Rates'}
            </Button>
          </form>
        </Card>
      )}

      {/* OTC Desk Form */}
      {activeTab === 'otc' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Update OTC Desk Configuration</h3>
          <form onSubmit={handleOtcSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USD Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 10000"
                  value={otcForm.usd_cost}
                  onChange={(e) => setOtcForm({ ...otcForm, usd_cost: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NGN Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 15500000"
                  value={otcForm.ngn_cost}
                  onChange={(e) => setOtcForm({ ...otcForm, ngn_cost: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desk Spread (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 25"
                  value={otcForm.desk_spread}
                  onChange={(e) => setOtcForm({ ...otcForm, desk_spread: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Implied Rate:</strong>{' '}
                {otcForm.usd_cost && otcForm.ngn_cost
                  ? `₦${(parseFloat(otcForm.ngn_cost) / parseFloat(otcForm.usd_cost)).toFixed(2)}`
                  : 'Enter values'}
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
            >
              {loading ? 'Updating...' : 'Update OTC Configuration'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
