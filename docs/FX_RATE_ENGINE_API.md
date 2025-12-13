# FX Rate Engine API Documentation

## Base URL
```
https://your-domain.com/api/fx
```

## Authentication
All endpoints require API key authentication via the `x-api-key` header:
```bash
curl -H "x-api-key: your_api_key" https://your-domain.com/api/fx/rate
```

## Endpoints

### 1. Get Current Rate
**GET** `/api/fx/rate`

Returns the current USD → NGN exchange rate with all calculation components.

**Headers:**
- `x-api-key` (required): Your API key
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

### 2. Get Rate History
**GET** `/api/fx/history`

Returns historical rates within a specified time period.

**Headers:**
- `x-api-key` (required): Your API key

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

**Headers:**
- `x-api-key` (required): Internal API key

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

**Example:**
```bash
curl -X POST \
  -H "x-api-key: internal_api_key" \
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

**Headers:**
- `x-api-key` (required): Internal API key

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

**Example:**
```bash
curl -H "x-api-key: internal_api_key" \
  https://your-domain.com/api/fx/internal/crypto-rates
```

---

### 5. Update OTC Desk Rates
**POST** `/api/fx/internal/otc-desk`

Updates OTC desk spread and USD cost data.

**Headers:**
- `x-api-key` (required): Internal API key

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

**Headers:**
- `x-api-key` (required): Internal API key

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

**Example:**
```bash
curl -H "x-api-key: internal_api_key" \
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
