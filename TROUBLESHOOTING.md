# Troubleshooting Guide - Internal Server Error

## 🔍 Diagnosis Steps

### 1. Check Environment Variables
The most common cause of "Internal Server Error" is missing Supabase configuration.

**Verify your `.env.local` has:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
INTERNAL_API_KEYS=key1,key2,key3
CRON_SECRET=your_cron_secret
COINMARKETCAP_API_KEY=your_api_key
IP_WHITELIST=
LIQUIDITY_SPREAD_MIN=-10
LIQUIDITY_SPREAD_MAX=50
```

**To get Supabase credentials:**
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy `Project URL` and `anon public key`

### 2. Check Server Logs
Look for errors in the development server output:

```bash
# If running dev server, check console output for:
- Database connection errors
- Missing environment variables
- TypeError or ReferenceError
- Module not found errors
```

### 3. Check Browser Console
Press `F12` in browser and look for:
- Network errors (red entries in Network tab)
- JavaScript errors (Console tab)
- CORS issues

### 4. Check Supabase Connection
Test if Supabase credentials are valid:

```bash
curl -H "apikey: your_anon_key" \
  https://your_project.supabase.co/rest/v1/fx_rate_calculations?select=*&limit=1
```

Should return `[]` or data, not an error.

---

## ❌ Common Errors & Solutions

### Error: "Cannot find module '@/lib/supabaseClient'"
**Cause**: Import path misconfiguration
**Fix**: 
1. Verify `lib/supabaseClient.ts` exists
2. Check tsconfig.json has `"@": "./"`
3. Rebuild: `yarn build`

### Error: "supabase.from() is not a function"
**Cause**: Supabase client not initialized properly
**Fix**: 
1. Verify environment variables are set
2. Restart dev server: `yarn dev`
3. Check `.env.local` file in root directory

### Error: "Unauthorized" (401)
**Cause**: Missing or invalid API key in request
**Fix**:
```bash
# Verify you're sending x-api-key header
curl -H "x-api-key: your_key_from_INTERNAL_API_KEYS" \
  http://localhost:3000/api/fx/rate

# Check INTERNAL_API_KEYS env var
echo $INTERNAL_API_KEYS
```

### Error: "Failed to fetch rate" / "Failed to update"
**Cause**: Supabase tables don't exist or API key lacks permissions
**Fix**:
1. Create tables in Supabase (see DATABASE_SETUP.sql below)
2. Verify `fx_rate_calculations` table exists
3. Check RLS policies aren't blocking inserts

### Error: Chart not displaying
**Cause**: recharts not installed or history data missing
**Fix**:
```bash
# Install recharts
yarn add recharts

# Verify installation
yarn list recharts

# Trigger a rate calculation to populate history
curl -H "authorization: Bearer your_cron_secret" \
  http://localhost:3000/api/cron/update-rates
```

### Error: "Rate management page not found"
**Cause**: Page file not created
**Fix**:
```bash
# Ensure file exists
ls app/dashboard/management/page.tsx

# Rebuild if missing
yarn build
```

---

## 🔧 Quick Fixes

### 1. Clear Cache and Rebuild
```bash
rm -rf .next node_modules
yarn install
yarn build
yarn dev
```

### 2. Verify All Required Tables Exist
Run this SQL in Supabase:

```sql
-- Check if tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'fx_%' OR tablename LIKE '%rate%';

-- You should see:
-- fx_rate_calculations
-- external_rate_sources
-- internal_crypto_rates
-- otc_desk_rates
-- rate_calculation_logs
```

### 3. Create Missing Tables
If tables don't exist, run this SQL in Supabase → SQL Editor:

```sql
-- fx_rate_calculations
CREATE TABLE IF NOT EXISTS fx_rate_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baseline_rate DECIMAL NOT NULL,
  crypto_implied_rate DECIMAL,
  crypto_premium DECIMAL DEFAULT 0,
  liquidity_spread DECIMAL DEFAULT 0,
  desk_spread DECIMAL DEFAULT 0,
  final_usd_ngn_rate DECIMAL NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  calculation_method VARCHAR(50) DEFAULT 'baseline_only',
  raw_sources JSONB
);

-- internal_crypto_rates
CREATE TABLE IF NOT EXISTS internal_crypto_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usdt_ngn_sell DECIMAL,
  usdt_ngn_buy DECIMAL,
  usdt_usd_rate DECIMAL DEFAULT 1.0,
  btc_usdt_price DECIMAL,
  btc_ngn_price DECIMAL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- otc_desk_rates
CREATE TABLE IF NOT EXISTS otc_desk_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usd_cost DECIMAL NOT NULL,
  ngn_cost DECIMAL,
  desk_spread DECIMAL NOT NULL,
  updated_by VARCHAR(100) DEFAULT 'system',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- rate_calculation_logs
CREATE TABLE IF NOT EXISTS rate_calculation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- external_rate_sources
CREATE TABLE IF NOT EXISTS external_rate_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name VARCHAR(100) NOT NULL,
  usd_ngn_rate DECIMAL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'success',
  response_time_ms INTEGER
);
```

### 4. Check Supabase Credentials
```bash
# In terminal, verify env vars are loaded
printenv | grep SUPABASE

# If empty, add to .env.local and restart server
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

## 📋 Error Checklist

- [ ] `.env.local` exists in project root
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set and not empty
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set and not empty
- [ ] `INTERNAL_API_KEYS` environment variable is configured
- [ ] All 5 required tables exist in Supabase
- [ ] Dev server restarted after env changes
- [ ] `lib/supabaseClient.ts` file exists
- [ ] `components/RateEngine.tsx` file exists
- [ ] `components/RateManagement.tsx` file exists
- [ ] `app/dashboard/management/page.tsx` file exists
- [ ] `recharts` package installed (`yarn list recharts`)
- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] Network requests show 200 status, not 500

---

## 🐛 Debug Mode

### Enable Detailed Logging
Edit `lib/fx-engine/utils/logger.ts`:
```typescript
export async function logRateCalculation(...) {
  console.log('[DEBUG]', { level, message, context }); // Add this
  try {
    await supabase.from('rate_calculation_logs').insert({...});
  } catch (err) {
    console.error('[DB LOG ERROR]', err); // More detailed
  }
}
```

### Test API Manually
```bash
# Test rate endpoint
curl -v -H "x-api-key: test_key" \
  http://localhost:3000/api/fx/rate

# Test history endpoint
curl -v -H "x-api-key: test_key" \
  "http://localhost:3000/api/fx/history?limit=5&hours=1"

# Test crypto rates endpoint
curl -X POST \
  -H "x-api-key: test_key" \
  -H "Content-Type: application/json" \
  -d '{"usdt_ngn_sell": 1550}' \
  http://localhost:3000/api/fx/internal/crypto-rates
```

### Check Database Directly
In Supabase SQL Editor:
```sql
-- Check if data exists
SELECT * FROM fx_rate_calculations ORDER BY timestamp DESC LIMIT 1;
SELECT * FROM internal_crypto_rates ORDER BY timestamp DESC LIMIT 1;
SELECT * FROM rate_calculation_logs ORDER BY timestamp DESC LIMIT 5;

-- Check for errors
SELECT * FROM rate_calculation_logs WHERE level = 'error' LIMIT 10;
```

---

## 🆘 Still Having Issues?

If error persists, provide:

1. **Full error message** from browser or console
2. **API endpoint** that's failing
3. **HTTP status code** (500, 502, etc.)
4. **Browser console screenshot**
5. **Supabase project status** (check supabase.com dashboard)
6. **Network tab response** showing the error

---

## 📞 Support

- Check browser DevTools (F12) → Console tab
- Check terminal where `yarn dev` runs
- Check Supabase dashboard for table existence
- Verify all environment variables with `yarn env`

---

**Last Updated:** December 10, 2025
