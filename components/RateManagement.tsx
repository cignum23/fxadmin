'use client';

import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Copy, KeyRound, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';

const supabase = createSupabaseBrowserClient();

type BaselineRateInfo = {
  usdt_ngn_buy: number | null;
  usdt_ngn_sell: number | null;
  usdt_usd_rate: number | null;
  btc_usdt_price: number | null;
  btc_ngn_price: number | null;
  timestamp: string;
};

type RateReadApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  status: 'active' | 'revoked';
  notes: string | null;
  created_by_email: string | null;
  created_at: string;
  last_used_at: string | null;
  last_used_ip: string | null;
  revoked_at: string | null;
};

export function RateManagement() {
  const [activeTab, setActiveTab] = useState<'crypto' | 'otc'>('crypto');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [baselineRateInfo, setBaselineRateInfo] = useState<BaselineRateInfo | null>(null);

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
            timestamp: data.timestamp,
          });
        }
      } catch (err) {
        console.error('Failed to fetch internal rates:', err);
      }
    };

    fetchInternalRates();
    const interval = setInterval(fetchInternalRates, 30000);
    return () => clearInterval(interval);
  }, []);

  const [cryptoForm, setCryptoForm] = useState({
    usdt_ngn_sell: '',
    usdt_ngn_buy: '',
    usdt_usd_rate: '1.0',
    btc_usdt_price: '',
    btc_ngn_price: '',
  });

  const [otcForm, setOtcForm] = useState({
    usd_cost: '',
    ngn_cost: '',
    desk_spread: '',
  });

  const handleCryptoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        usdt_ngn_sell: cryptoForm.usdt_ngn_sell ? parseFloat(cryptoForm.usdt_ngn_sell) : null,
        usdt_ngn_buy: cryptoForm.usdt_ngn_buy ? parseFloat(cryptoForm.usdt_ngn_buy) : null,
        usdt_usd_rate: parseFloat(cryptoForm.usdt_usd_rate) || 1.0,
        btc_usdt_price: cryptoForm.btc_usdt_price ? parseFloat(cryptoForm.btc_usdt_price) : null,
        btc_ngn_price: cryptoForm.btc_ngn_price ? parseFloat(cryptoForm.btc_ngn_price) : null,
      };

      const response = await fetch('/api/fx/internal/crypto-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error || 'Failed to update crypto rates');
      }

      setMessage({ type: 'success', text: 'Crypto rates updated successfully' });
      setCryptoForm({
        usdt_ngn_sell: '',
        usdt_ngn_buy: '',
        usdt_usd_rate: '1.0',
        btc_usdt_price: '',
        btc_ngn_price: '',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Update failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtcSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        usd_cost: parseFloat(otcForm.usd_cost),
        ngn_cost: parseFloat(otcForm.ngn_cost),
        desk_spread: parseFloat(otcForm.desk_spread),
      };

      const response = await fetch('/api/fx/internal/otc-desk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error || 'Failed to update OTC desk');
      }

      setMessage({ type: 'success', text: 'OTC desk rates updated successfully' });
      setOtcForm({ usd_cost: '', ngn_cost: '', desk_spread: '' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Update failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const metricCards = baselineRateInfo
    ? [
        ['USDT/NGN Buy Rate', baselineRateInfo.usdt_ngn_buy, (v: number) => `\u20A6${v.toFixed(2)}`],
        ['USDT/NGN Sell Rate', baselineRateInfo.usdt_ngn_sell, (v: number) => `\u20A6${v.toFixed(2)}`],
        ['USDT/USD Rate', baselineRateInfo.usdt_usd_rate, (v: number) => `$${v.toFixed(4)}`],
        ['BTC/USDT Price', baselineRateInfo.btc_usdt_price, (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`],
        ['BTC/NGN Price', baselineRateInfo.btc_ngn_price, (v: number) => `\u20A6${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`],
      ] as const
    : [];

  return (
    <div className="fx-page space-y-6">
      <div>
        <p className="fx-label mb-2">Internal Controls</p>
        <h1 className="text-3xl font-bold text-[var(--color-text-strong)]">Rate Management</h1>
      </div>

      {baselineRateInfo && (
        <Card className="bg-[color-mix(in_srgb,var(--color-surface)_86%,white)]">
          <CardHeader>
            <CardTitle>Current Internal Crypto Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {metricCards.map(([label, value, formatter]) => (
                value ? (
                  <div key={label} className="rounded-lg border border-border bg-white p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
                    <p className="text-2xl font-extrabold text-primary">{formatter(value)}</p>
                  </div>
                ) : null
              ))}
            </div>
            <p className="border-t border-border pt-4 text-sm font-medium text-muted-foreground">
              Last updated: {new Date(baselineRateInfo.timestamp).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {message && (
        <Card className={cn('p-4', message.type === 'success' ? 'bg-success/10 border-success/25' : 'bg-danger/10 border-danger/25')}>
          <p className={cn('font-semibold', message.type === 'success' ? 'text-success' : 'text-danger')}>
            {message.text}
          </p>
        </Card>
      )}

      <ApiKeyManagement />

      <div className="inline-flex rounded-lg border border-border bg-white/60 p-1">
        {(['crypto', 'otc'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] transition',
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'
            )}
          >
            {tab === 'crypto' ? 'Crypto Rates' : 'OTC Desk'}
          </button>
        ))}
      </div>

      {activeTab === 'crypto' && (
        <Card>
          <CardHeader>
            <CardTitle>Update Internal Crypto Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCryptoSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="USDT/NGN Sell Rate">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 1550.50"
                    value={cryptoForm.usdt_ngn_sell}
                    onChange={(e) => setCryptoForm({ ...cryptoForm, usdt_ngn_sell: e.target.value })}
                  />
                </Field>

                <Field label="USDT/NGN Buy Rate">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 1545.50"
                    value={cryptoForm.usdt_ngn_buy}
                    onChange={(e) => setCryptoForm({ ...cryptoForm, usdt_ngn_buy: e.target.value })}
                  />
                </Field>

                <Field label="USDT/USD Rate">
                  <Input
                    type="number"
                    step="0.001"
                    value={cryptoForm.usdt_usd_rate}
                    onChange={(e) => setCryptoForm({ ...cryptoForm, usdt_usd_rate: e.target.value })}
                  />
                </Field>

                <Field label="BTC/USDT Price">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 45000"
                    value={cryptoForm.btc_usdt_price}
                    onChange={(e) => setCryptoForm({ ...cryptoForm, btc_usdt_price: e.target.value })}
                  />
                </Field>

                <Field label="BTC/NGN Price">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 70000000"
                    value={cryptoForm.btc_ngn_price}
                    onChange={(e) => setCryptoForm({ ...cryptoForm, btc_ngn_price: e.target.value })}
                  />
                </Field>
              </div>

              <Button type="submit" disabled={loading} className="w-full rounded-lg py-2.5">
                {loading ? 'Updating...' : 'Update Crypto Rates'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'otc' && (
        <Card>
          <CardHeader>
            <CardTitle>Update OTC Desk Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOtcSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="USD Cost">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 10000"
                    value={otcForm.usd_cost}
                    onChange={(e) => setOtcForm({ ...otcForm, usd_cost: e.target.value })}
                    required
                  />
                </Field>

                <Field label="NGN Cost">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 15500000"
                    value={otcForm.ngn_cost}
                    onChange={(e) => setOtcForm({ ...otcForm, ngn_cost: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Desk Spread">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 25"
                    value={otcForm.desk_spread}
                    onChange={(e) => setOtcForm({ ...otcForm, desk_spread: e.target.value })}
                    required
                  />
                </Field>
              </div>

              <div className="rounded-lg border border-border bg-white p-4">
                <p className="text-sm font-semibold text-foreground">
                  Implied Rate:{' '}
                  <span className="text-primary">
                    {otcForm.usd_cost && otcForm.ngn_cost
                      ? `\u20A6${(parseFloat(otcForm.ngn_cost) / parseFloat(otcForm.usd_cost)).toFixed(2)}`
                      : 'Enter values'}
                  </span>
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full rounded-lg py-2.5">
                {loading ? 'Updating...' : 'Update OTC Configuration'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ApiKeyManagement() {
  const [keys, setKeys] = useState<RateReadApiKey[]>([]);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fx/internal/rate-keys', { cache: 'no-store' });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? 'Failed to load API keys');
      }

      const data = await response.json() as { keys: RateReadApiKey[] };
      setKeys(data.keys);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load API keys' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const createKey = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setMessage(null);
    setRevealedKey(null);

    try {
      const response = await fetch('/api/fx/internal/rate-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, notes }),
      });

      const data = await response.json().catch(() => null) as { key?: RateReadApiKey; secret?: string; error?: string } | null;
      if (!response.ok || !data?.key || !data.secret) {
        throw new Error(data?.error ?? 'Failed to create API key');
      }

      setKeys((current) => [data.key!, ...current]);
      setRevealedKey(data.secret);
      setName('');
      setNotes('');
      setMessage({ type: 'success', text: 'API key created. Copy it now; it will not be shown again.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create API key' });
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (id: string) => {
    setRevokingId(id);
    setMessage(null);

    try {
      const response = await fetch(`/api/fx/internal/rate-keys/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? 'Failed to revoke API key');
      }

      setKeys((current) => current.map((key) => (
        key.id === id
          ? { ...key, status: 'revoked', revoked_at: new Date().toISOString() }
          : key
      )));
      setMessage({ type: 'success', text: 'API key revoked.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to revoke API key' });
    } finally {
      setRevokingId(null);
    }
  };

  const copyRevealedKey = async () => {
    if (!revealedKey) return;
    await navigator.clipboard.writeText(revealedKey);
    setMessage({ type: 'success', text: 'API key copied.' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Read-only API Keys</CardTitle>
            <p className="mt-2 max-w-2xl text-sm font-medium text-muted-foreground">
              Generate revocable keys for third-party apps that only need the current USD/NGN FX Admin rate.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-foreground">
            GET /api/fx/public/current-rate
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {message && (
          <div className={cn('rounded-md border p-3 text-sm font-semibold', message.type === 'success' ? 'border-success/20 bg-success/10 text-success' : 'border-danger/20 bg-danger/10 text-danger')}>
            {message.text}
          </div>
        )}

        {revealedKey && (
          <div className="rounded-xl border border-primary bg-primary/10 p-4">
            <p className="mb-2 text-sm font-bold text-[var(--color-text-strong)]">Copy this key now. It will not be shown again.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={revealedKey} readOnly className="font-mono text-xs" />
              <Button type="button" onClick={copyRevealedKey} className="shrink-0 gap-2">
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={createKey} className="grid gap-4 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
          <Field label="Partner/app name">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Cignum Wallet"
              required
              minLength={3}
              maxLength={80}
            />
          </Field>

          <Field label="Notes">
            <Input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional usage note"
              maxLength={240}
            />
          </Field>

          <Button type="submit" disabled={creating} className="gap-2">
            <KeyRound className="h-4 w-4" />
            {creating ? 'Creating...' : 'Create key'}
          </Button>
        </form>

        <div className="fx-table-shell">
          <table className="fx-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Prefix</th>
                <th>Status</th>
                <th>Last used</th>
                <th>Created</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground">Loading API keys...</td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground">No read-only API keys yet.</td>
                </tr>
              ) : (
                keys.map((key) => (
                  <tr key={key.id}>
                    <td>
                      <div className="font-bold text-[var(--color-text-strong)]">{key.name}</div>
                      {key.notes && <div className="text-xs font-medium text-muted-foreground">{key.notes}</div>}
                    </td>
                    <td className="font-mono text-xs text-foreground">{key.key_prefix}</td>
                    <td>
                      <span className={cn('fx-badge', key.status === 'active' ? 'border-success/25 bg-success/10 text-success' : 'border-danger/25 bg-danger/10 text-danger')}>
                        {key.status}
                      </span>
                    </td>
                    <td>{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}</td>
                    <td>{new Date(key.created_at).toLocaleDateString()}</td>
                    <td className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={key.status !== 'active' || revokingId === key.id}
                        onClick={() => revokeKey(key.id)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {revokingId === key.id ? 'Revoking...' : 'Revoke'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
