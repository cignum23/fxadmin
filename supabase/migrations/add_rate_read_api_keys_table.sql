-- Stores revocable read-only API keys for external consumers of FX Admin's
-- current-rate endpoint. Plaintext keys are shown once by the app and are
-- never stored in Supabase.

CREATE TABLE IF NOT EXISTS public.rate_read_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 80),
  key_prefix TEXT NOT NULL UNIQUE,
  key_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  last_used_ip TEXT,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_read_api_keys_status
  ON public.rate_read_api_keys(status);

CREATE INDEX IF NOT EXISTS idx_rate_read_api_keys_created_at
  ON public.rate_read_api_keys(created_at DESC);

ALTER TABLE public.rate_read_api_keys ENABLE ROW LEVEL SECURITY;

-- Server route handlers use the service role for all key-management reads and
-- writes. Browser clients must never query key hashes directly.
DROP POLICY IF EXISTS "Service role manages rate_read_api_keys" ON public.rate_read_api_keys;
CREATE POLICY "Service role manages rate_read_api_keys"
  ON public.rate_read_api_keys
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
