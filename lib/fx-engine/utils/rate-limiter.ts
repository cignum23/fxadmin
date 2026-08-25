// Durable, per-identifier rate limiter backed by Supabase (rate_limit_events table).
// Replaces the previous in-memory Map, which reset on every serverless cold
// start/deploy and was called with no identifier (one shared global bucket
// for every caller instead of a per-IP limit).
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS = 60;
const CLEANUP_SAMPLE_RATE = 0.02; // best-effort housekeeping, ~1 in 50 calls

function windowStart(now: number): string {
  const bucket = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  return new Date(bucket).toISOString();
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Returns true if the request is allowed, false if `identifier` has exceeded
 * `maxRequests` within the current 60s window. Fails open (allows the
 * request) if the durability store itself is unreachable, so a Supabase
 * outage degrades to "no rate limiting" rather than blocking all traffic.
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = DEFAULT_MAX_REQUESTS
): Promise<boolean> {
  const now = Date.now();
  const bucket = windowStart(now);

  const { data: existing, error: selectError } = await supabaseAdmin
    .from('rate_limit_events')
    .select('id, count')
    .eq('identifier', identifier)
    .eq('window_start', bucket)
    .maybeSingle();

  if (selectError) {
    console.error('Rate limiter select failed, failing open:', selectError);
    return true;
  }

  if (Math.random() < CLEANUP_SAMPLE_RATE) {
    void supabaseAdmin
      .from('rate_limit_events')
      .delete()
      .lt('window_start', new Date(now - 60 * 60 * 1000).toISOString());
  }

  if (!existing) {
    const { error: insertError } = await supabaseAdmin
      .from('rate_limit_events')
      .insert({ identifier, window_start: bucket, count: 1 });
    if (insertError) {
      console.warn('Rate limiter insert race (treating as allowed):', insertError);
    }
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  const { error: updateError } = await supabaseAdmin
    .from('rate_limit_events')
    .update({ count: existing.count + 1 })
    .eq('id', existing.id);

  if (updateError) {
    console.error('Rate limiter update failed, failing open:', updateError);
  }

  return true;
}
