-- Backing store for the durable, per-IP rate limiter
-- (lib/fx-engine/utils/rate-limiter.ts), replacing the previous in-memory
-- Map that reset on every serverless cold start/deploy and was shared
-- across all callers instead of being scoped per-IP.
--
-- NOT applied automatically — review and run this against the production
-- Supabase project yourself before the rate limiter code goes live, since
-- checkRateLimit() will error on every call (failing open) until this
-- table exists.

CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rate_limit_events_identifier_window_key UNIQUE (identifier, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_identifier ON public.rate_limit_events (identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_window_start ON public.rate_limit_events (window_start);

ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;

-- Service role only — this table is never read or written from the client.
DROP POLICY IF EXISTS "Service role manages rate_limit_events" ON rate_limit_events;
CREATE POLICY "Service role manages rate_limit_events"
  ON rate_limit_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
