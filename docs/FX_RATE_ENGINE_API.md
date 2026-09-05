# FX Rate Engine API Documentation

## Base URL
```
https://your-domain.com/api/fx
```

## Authentication
Two key classes exist, and they are **not interchangeable**:

- **Generated rate-read keys** — read-only. Accepted by `/api/fx/public/current-rate` only.
  This is the key class external/mobile clients should be issued.
- **Internal keys** (`INTERNAL_API_KEYS`) — accepted by `/api/fx/rate` and `/api/fx/history`
  for backward compatibility with trusted internal server callers. `/api/fx/rate` recalculates
  and stores a new rate, so generated partner keys are deliberately not accepted there.
- **Admin session cookies** — required for `/api/fx/internal/*` management endpoints and also
  accepted by the dashboard's authenticated rate views.

Generated read keys are sent with `Authorization: Bearer <key>` or `x-api-key`:
```bash
curl -H "Authorization: Bearer your_generated_rate_read_key" \
  https://your-domain.com/api/fx/public/current-rate
```

## Endpoints

### 1. Get Public Current Rate
**GET** `/api/fx/public/current-rate`

Returns the latest stored USD to NGN rate for third-party consumers without
triggering a new rate calculation or any write-side engine behavior.

**Headers:**
- `Authorization: Bearer <key>` or `x-api-key` (required): A generated
  rate-read key, or a legacy server-only env read key during migration.

**Response:**
```json
{
  "base": "USD",
  "quote": "NGN",
  "rate": 1456.65,
  "asOf": "2025-12-10T14:30:00.000Z",
  "stale": false,
  "source": "fxadmin",
  "calculationMethod": "full_3layer"
}
```

**Status Codes:**
- `200`: Success
- `401`: Missing, invalid, or revoked key
- `429`: Rate limit exceeded. Response includes `Retry-After: 60`.
- `500`: Database lookup failed
- `503`: No current cached FX rate is available

**Rate limit:**
The public current-rate endpoint uses a separate wallet-safe quota keyed by generated key plus caller IP. Default: `600` requests/minute. Override with `FX_PUBLIC_RATE_LIMIT_PER_MINUTE`.

**Vercel edge protection:**
If production returns HTML with `X-Vercel-Mitigated: challenge`, the request is being blocked by Vercel before this Next.js route runs. Apply the scoped firewall bypass in `docs/VERCEL_FIREWALL_PUBLIC_FX_RATE.md`; do not disable route auth or expose a Vercel automation bypass secret to mobile clients.

**Example:**
```bash
curl -H "Authorization: Bearer your_rate_read_key" \
  https://your-domain.com/api/fx/public/current-rate
```

---

### 2. Get Current Rate With Calculation Details
**GET** `/api/fx/rate`

Returns the current USD → NGN exchange rate with all calculation components.

**Headers:**
- `x-api-key` (required): An internal key, or omit if calling with an authenticated dashboard
  session cookie instead
- `x-forwarded-for` (optional): For IP whitelist verification

**Query Parameters:**
None

**Response:**
```json
{
  "baseline_rate": 1450.50,
  "crypto_implied_rate": 1455.75,
  "crypto_premium": 5.25,
  "liquidity_spread": -2.10,
  "desk_spread": 3.00,
  "final_usd_ngn_rate": 1456.65,
  "timestamp": "2025-12-10T14:30:00.000Z",
  "calculation_method": "full_3layer"
}
```

**Status Codes:**
- `200`: Success
- `401`: Invalid API key
- `403`: IP not whitelisted
- `429`: Rate limit exceeded (60 requests/minute)
- `500`: Rate calculation failed

**Example:**
```bash
curl -H "x-api-key: your_api_key" https://your-domain.com/api/fx/rate
```

---

### 3. Get Rate History
**GET** `/api/fx/history`

Returns historical rates within a specified time period.

**Headers:**
- `x-api-key` (required): A rate-read key, an internal key, or omit if calling with an
  authenticated dashboard session cookie instead

**Query Parameters:**
- `limit` (optional, default: 100): Maximum number of records (max 1000)
- `hours` (optional, default: 24): Time period in hours to look back

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "timestamp": "2025-12-10T14:30:00.000Z",
      "baseline_rate": 1450.50,
      "crypto_implied_rate": 1455.75,
      "crypto_premium": 5.25,
      "liquidity_spread": -2.10,
      "desk_spread": 3.00,
      "final_usd_ngn_rate": 1456.65
    }
  ],
  "count": 48,
  "period": "24h"
}
```

**Example:**
```bash
# Last 24 hours (default)
curl -H "x-api-key: your_api_key" https://your-domain.com/api/fx/history

# Last 7 days, limit 200 records
curl -H "x-api-key: your_api_key" \
  "https://your-domain.com/api/fx/history?hours=168&limit=200"
```

---

### 3. Update Internal Crypto Rates
**POST** `/api/fx/internal/crypto-rates`

Updates the internal crypto rate data used for crypto-implied rate calculation.

**Auth:** No API key is accepted here. Requires a logged-in Supabase admin session
(dashboard cookie) — this is the endpoint that writes the margin the whole rate engine is
built on, so it is intentionally session-only, not key-accessible at all.

**Request Body:**
```json
{
  "usdt_ngn_buy": 1450.00,
  "usdt_ngn_sell": 1455.00,
  "usdt_usd_rate": 1.0,
  "btc_usdt_price": 45000.00,
  "btc_ngn_price": 65250000.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Crypto rates updated successfully"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing required fields
- `401`: Unauthorized
- `500`: Database error

**Example:** (requires a browser session cookie from a logged-in dashboard admin — cannot
be called with `curl` and a static key)
```bash
curl -X POST \
  -b "<dashboard session cookie>" \
  -H "Content-Type: application/json" \
  -d '{
    "usdt_ngn_sell": 1455.00,
    "usdt_usd_rate": 1.0,
    "btc_ngn_price": 65250000.00,
    "btc_usdt_price": 45000.00
  }' \
  https://your-domain.com/api/fx/internal/crypto-rates
```

---

### 4. Get Latest Internal Crypto Rates
**GET** `/api/fx/internal/crypto-rates`

Retrieves the latest stored internal crypto rate data.

**Auth:** No API key is accepted — same Supabase admin session requirement as Endpoint 3.

**Response:**
```json
{
  "id": "uuid",
  "timestamp": "2025-12-10T14:30:00.000Z",
  "usdt_ngn_buy": 1450.00,
  "usdt_ngn_sell": 1455.00,
  "usdt_usd_rate": 1.0,
  "btc_usdt_price": 45000.00,
  "btc_ngn_price": 65250000.00
}
```

**Example:** (requires a browser session cookie from a logged-in dashboard admin)
```bash
curl -b "<dashboard session cookie>" \
  https://your-domain.com/api/fx/internal/crypto-rates
```

---

### 5. Update OTC Desk Rates
**POST** `/api/fx/internal/otc-desk`

Updates OTC desk spread and USD cost data.

**Auth:** No API key is accepted here either — same Supabase admin session requirement as
Endpoint 3, for the same reason.

**Request Body:**
```json
{
  "usd_cost": 1452.50,
  "ngn_cost": 2100000.00,
  "desk_spread": 2.50,
  "updated_by": "trader_name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTC desk rates updated successfully"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing required fields (usd_cost, desk_spread)
- `401`: Unauthorized
- `500`: Database error

**Example:**
```bash
curl -X POST \
  -H "x-api-key: internal_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "usd_cost": 1452.50,
    "desk_spread": 2.50,
    "updated_by": "trader_desk"
  }' \
  https://your-domain.com/api/fx/internal/otc-desk
```

---

### 6. Get Latest OTC Desk Rates
**GET** `/api/fx/internal/otc-desk`

Retrieves the latest OTC desk rate configuration.

**Auth:** No API key is accepted — same Supabase admin session requirement as Endpoint 3.

**Response:**
```json
{
  "id": "uuid",
  "timestamp": "2025-12-10T14:30:00.000Z",
  "usd_cost": 1452.50,
  "ngn_cost": 2100000.00,
  "desk_spread": 2.50,
  "updated_by": "trader_desk"
}
```

**Example:** (requires a browser session cookie from a logged-in dashboard admin)
```bash
curl -b "<dashboard session cookie>" \
  https://your-domain.com/api/fx/internal/otc-desk
```

---

### 7. Trigger Scheduled Rate Update (Cron)
**GET** `/api/cron/update-rates`

Manually trigger the rate calculation and storage (typically called by Vercel Cron).

**Headers:**
- `authorization` (required): `Bearer {CRON_SECRET}`

**Response:**
```json
{
  "success": true,
  "rate": 1456.65,
  "timestamp": "2025-12-10T14:35:00.000Z"
}
```

**Status Codes:**
- `200`: Success
- `401`: Invalid cron secret
- `500`: Rate calculation failed

**Example:**
```bash
curl -H "authorization: Bearer your_cron_secret" \
  https://your-domain.com/api/cron/update-rates
```

---

## Environment Variables

Required environment variables (add to `.env.local`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# API Authentication
INTERNAL_API_KEYS=key1,key2,key3
RATE_READ_API_KEYS=wallet_app_key1,other_read_client_key2
FX_PUBLIC_RATE_LIMIT_PER_MINUTE=600
CRON_SECRET=your_random_secret_key

# IP Whitelist (optional, leave empty to allow all)
IP_WHITELIST=127.0.0.1,192.168.1.1,your_server_ip

# Rate Engine Configuration
LIQUIDITY_SPREAD_MIN=-10
LIQUIDITY_SPREAD_MAX=50
FX_CACHE_TTL_SECONDS=300
```

---

## Rate Limiting

- **Global Limit:** 60 requests per minute
- **Rate Limit Headers:** Response includes `Retry-After` header when limit is exceeded
- **Status Code:** 429 (Too Many Requests)

---

## Error Handling

All errors return JSON with an `error` field:

```json
{
  "error": "Rate limit exceeded"
}
```

**Common Error Codes:**
- `400 Bad Request`: Invalid input or missing required fields
- `401 Unauthorized`: Missing or invalid API key
- `403 Forbidden`: IP not whitelisted
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side error

---

## Webhook Integration Example

Post rate updates to your webhook:

```bash
#!/bin/bash

API_KEY="your_api_key"
WEBHOOK_URL="https://your-webhook.example.com/rate-update"

# Get current rate every 30 minutes
rate=$(curl -s -H "x-api-key: $API_KEY" \
  https://your-domain.com/api/fx/rate)

# Post to webhook
curl -X POST \
  -H "Content-Type: application/json" \
  -d "$rate" \
  $WEBHOOK_URL
```

---

## Rate Calculation Details

**Formula:**
```
Final Rate = Baseline + Liquidity Spread + Crypto Premium + Desk Spread

Where:
- Baseline = Average of external market rates
- Liquidity Spread = (USD Cost - Baseline), clamped between -10 and +50
- Crypto Premium = (Crypto Implied Rate - Baseline)
- Desk Spread = OTC desk configuration value
```

**Fallback Priority:**
1. Full calculation with all components
2. Cached final rate (within 5 minutes)
3. Crypto-implied rate only
4. Last known baseline rate
5. Admin alert (all sources failed)

---

## Support

For issues or questions:
- Check the rate calculation logs in Supabase `rate_calculation_logs` table
- Verify API keys and environment variables
- Ensure Supabase connection is working
