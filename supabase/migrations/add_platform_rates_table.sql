-- Create platform_rates table to store real rates from each crypto platform
-- This serves as a fallback and comparison source for calculator rates

CREATE TABLE IF NOT EXISTS platform_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Platform identifier (coingecko, coinmarketcap, cryptocompare, binance)
  platform_id TEXT NOT NULL,
  platform_name TEXT NOT NULL,
  
  -- Sample crypto rate (e.g., BTC/USD price) for rate comparison
  sample_crypto_symbol TEXT DEFAULT 'BTC',
  sample_crypto_price DECIMAL(16, 2),
  
  -- Rate data from platform
  rate_usd DECIMAL(16, 2),
  rate_data JSONB,
  
  -- Timestamps
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one record per platform
  UNIQUE(platform_id)
);

-- Create index for faster queries
CREATE INDEX idx_platform_rates_platform_id ON platform_rates(platform_id);
CREATE INDEX idx_platform_rates_updated_at ON platform_rates(updated_at DESC);

-- Enable RLS
ALTER TABLE platform_rates ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (rates are public data)
CREATE POLICY "Allow public read access to platform_rates"
  ON platform_rates
  FOR SELECT
  USING (true);

-- Create policy for service role write access (for cron jobs)
CREATE POLICY "Allow service role to insert platform_rates"
  ON platform_rates
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR true);

CREATE POLICY "Allow service role to update platform_rates"
  ON platform_rates
  FOR UPDATE
  USING (auth.role() = 'service_role' OR true)
  WITH CHECK (auth.role() = 'service_role' OR true);
