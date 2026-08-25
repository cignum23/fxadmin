-- Fix RLS holes discovered in audit:
--   1. external_rate_sources / fx_rate_calculations / internal_crypto_rates /
--      platform_rates all had "WITH CHECK (auth.role() = 'service_role' OR true)"
--      — the `OR true` makes the check always pass, so anyone holding the
--      public anon key can INSERT/UPDATE/DELETE these rows directly.
--   2. otc_desk_rates and rate_calculation_logs had RLS not enabled at all
--      (no ALTER TABLE ... ENABLE ROW LEVEL SECURITY in table_definitions.sql),
--      meaning they were fully open with no policy restriction whatsoever.
--
-- NOT applied automatically — review and run this against the production
-- Supabase project yourself (SQL editor or `supabase db push`), then
-- redeploy the app once lib/supabaseAdmin.ts (service-role client) is live,
-- since these policies now require the service role for all writes.

-- ============================================================
-- external_rate_sources
-- ============================================================
DROP POLICY IF EXISTS "Allow service role to insert external_rate_sources" ON external_rate_sources;
CREATE POLICY "Allow service role to insert external_rate_sources"
  ON external_rate_sources
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role to update external_rate_sources" ON external_rate_sources;
CREATE POLICY "Allow service role to update external_rate_sources"
  ON external_rate_sources
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role to delete external_rate_sources" ON external_rate_sources;
CREATE POLICY "Allow service role to delete external_rate_sources"
  ON external_rate_sources
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- fx_rate_calculations
-- ============================================================
DROP POLICY IF EXISTS "Allow service role to insert fx_rate_calculations" ON fx_rate_calculations;
CREATE POLICY "Allow service role to insert fx_rate_calculations"
  ON fx_rate_calculations
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role to update fx_rate_calculations" ON fx_rate_calculations;
CREATE POLICY "Allow service role to update fx_rate_calculations"
  ON fx_rate_calculations
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role to delete fx_rate_calculations" ON fx_rate_calculations;
CREATE POLICY "Allow service role to delete fx_rate_calculations"
  ON fx_rate_calculations
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- internal_crypto_rates
-- ============================================================
DROP POLICY IF EXISTS "Allow service role to insert internal_crypto_rates" ON internal_crypto_rates;
CREATE POLICY "Allow service role to insert internal_crypto_rates"
  ON internal_crypto_rates
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role to update internal_crypto_rates" ON internal_crypto_rates;
CREATE POLICY "Allow service role to update internal_crypto_rates"
  ON internal_crypto_rates
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role to delete internal_crypto_rates" ON internal_crypto_rates;
CREATE POLICY "Allow service role to delete internal_crypto_rates"
  ON internal_crypto_rates
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- platform_rates
-- ============================================================
DROP POLICY IF EXISTS "Allow service role to insert platform_rates" ON platform_rates;
CREATE POLICY "Allow service role to insert platform_rates"
  ON platform_rates
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role to update platform_rates" ON platform_rates;
CREATE POLICY "Allow service role to update platform_rates"
  ON platform_rates
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role to delete platform_rates" ON platform_rates;
CREATE POLICY "Allow service role to delete platform_rates"
  ON platform_rates
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- otc_desk_rates — had no RLS at all (fully open)
-- ============================================================
ALTER TABLE otc_desk_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to otc_desk_rates" ON otc_desk_rates;
CREATE POLICY "Allow public read access to otc_desk_rates"
  ON otc_desk_rates
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow service role to insert otc_desk_rates" ON otc_desk_rates;
CREATE POLICY "Allow service role to insert otc_desk_rates"
  ON otc_desk_rates
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role to update otc_desk_rates" ON otc_desk_rates;
CREATE POLICY "Allow service role to update otc_desk_rates"
  ON otc_desk_rates
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role to delete otc_desk_rates" ON otc_desk_rates;
CREATE POLICY "Allow service role to delete otc_desk_rates"
  ON otc_desk_rates
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- rate_calculation_logs — had no RLS at all (fully open)
-- ============================================================
ALTER TABLE rate_calculation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to rate_calculation_logs" ON rate_calculation_logs;
CREATE POLICY "Allow public read access to rate_calculation_logs"
  ON rate_calculation_logs
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow service role to insert rate_calculation_logs" ON rate_calculation_logs;
CREATE POLICY "Allow service role to insert rate_calculation_logs"
  ON rate_calculation_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role to delete rate_calculation_logs" ON rate_calculation_logs;
CREATE POLICY "Allow service role to delete rate_calculation_logs"
  ON rate_calculation_logs
  FOR DELETE
  USING (auth.role() = 'service_role');
