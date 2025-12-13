-- Create internal_crypto_rates table for storing manually configured rates
-- These rates are used as a platform option in the calculator

CREATE TABLE IF NOT EXISTS internal_crypto_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- USDT rates
  usdt_ngn_buy DECIMAL(10, 2),
  usdt_ngn_sell DECIMAL(10, 2),
  usdt_usd_rate DECIMAL(10, 4) DEFAULT 1.0,
  
  -- BTC rates
  btc_usdt_price DECIMAL(12, 2),
  btc_ngn_price DECIMAL(12, 2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_internal_crypto_rates_timestamp ON internal_crypto_rates(timestamp DESC);

-- Enable RLS
ALTER TABLE internal_crypto_rates ENABLE ROW LEVEL SECURITY;

-- Allow public read access (rates are public data)
CREATE POLICY "Allow public read access to internal_crypto_rates"
  ON internal_crypto_rates
  FOR SELECT
  USING (true);

-- Allow service role to insert (bypasses RLS)
CREATE POLICY "Allow service role to insert internal_crypto_rates"
  ON internal_crypto_rates
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR true);

-- Allow service role to update (bypasses RLS)
CREATE POLICY "Allow service role to update internal_crypto_rates"
  ON internal_crypto_rates
  FOR UPDATE
  USING (auth.role() = 'service_role' OR true)
  WITH CHECK (auth.role() = 'service_role' OR true);

-- Allow service role to delete (bypasses RLS)
CREATE POLICY "Allow service role to delete internal_crypto_rates"
  ON internal_crypto_rates
  FOR DELETE
  USING (auth.role() = 'service_role' OR true);
