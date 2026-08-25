import { createSupabaseServerClient } from '@/lib/supabase/server';

export function verifyApiKey(key: string | null | undefined): boolean {
  if (!key) return false;
  const validKeys = (process.env.INTERNAL_API_KEYS ?? '').split(',').map(k => k.trim()).filter(Boolean);
  return validKeys.includes(key);
}

/**
 * A separate, narrower key list for read-only rate consumers (e.g. the wallet
 * mobile app). Deliberately its own env var and its own check, not a wrapper
 * around verifyApiKey/INTERNAL_API_KEYS — a key issued from this list must
 * never double as an INTERNAL_API_KEYS value, since a key shipped inside a
 * mobile app binary should be assumed to leak eventually.
 */
export function verifyRateReadKey(key: string | null | undefined): boolean {
  if (!key) return false;
  const validKeys = (process.env.RATE_READ_API_KEYS ?? '').split(',').map(k => k.trim()).filter(Boolean);
  return validKeys.includes(key);
}

/**
 * Accepts either the existing x-api-key header (external server-to-server
 * callers, per docs/FX_RATE_ENGINE_API.md) or a logged-in Supabase session
 * (the dashboard itself) — so an already-authenticated admin isn't also
 * required to paste a static key just to view a page inside /dashboard.
 */
export async function verifyApiKeyOrSession(request: Request): Promise<boolean> {
  if (verifyApiKey(request.headers.get('x-api-key'))) {
    return true;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return !!user;
}

/**
 * Read-only rate endpoints (/api/fx/rate, /api/fx/history) accept three
 * credential types: a scoped rate-read key (mobile/external read clients), an
 * INTERNAL_API_KEYS value (existing internal server-to-server callers, kept
 * for backward compatibility), or a logged-in dashboard session.
 */
export async function verifyRateReadKeyOrSession(request: Request): Promise<boolean> {
  if (verifyRateReadKey(request.headers.get('x-api-key'))) {
    return true;
  }
  return verifyApiKeyOrSession(request);
}

export function verifyIPWhitelist(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const whitelist = (process.env.IP_WHITELIST ?? '').split(',').map(s => s.trim()).filter(Boolean);
  
  // If no whitelist configured, allow all
  if (whitelist.length === 0) return true;
  
  return whitelist.includes(ip);
}
