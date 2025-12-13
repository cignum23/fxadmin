# fxadmin – Project Documentation

This project is a Next.js + Tailwind CSS admin dashboard for FX rate computation, crypto price monitoring, and rate management. It integrates live vendor sources, platform APIs, and internal controls to produce reliable USD→NGN rates and conversions.

## Overview

- Frontend: Next.js App Router, Tailwind CSS, shadcn/ui components
- Data: Supabase (tables: `platform_rates`, `internal_crypto_rates`, etc.)
- APIs: Internal Next.js API routes under `app/api/**` with server-side Supabase access
- Live sources: CoinGecko, Binance, CryptoCompare, CoinMarketCap, and vendor aggregation endpoint `/api/fx/vendors`

## Dashboard – FX Rate Engine

- Requires an internal API key to calculate and display the current rate in the engine views.
- Example display:
	- Current Rate: ₦1500.00 (1 USD = 1500.00 NGN)
	- Updated: 12/13/2025, 11:43:39 PM

- Rate Components & Calculation Details:
	- Baseline Rate: ₦1465.06 (from vendor sources: e.g., CryptoCompare, CoinGecko_FX)
	- Crypto Implied: ₦1510.00
	- Crypto Premium: +₦44.94
	- Liquidity Spread: Raw ₦-10.00 → Clamped ₦-10.00
	- OTC Desk Status: using defaults (or configured via Rate Management)

- Flow:
	1. Vendors endpoint `/api/fx/vendors` retrieves multiple external FX sources independently (no median enforced client-side; cron and APIs decide usage).
	2. Cron job `/api/cron/update-platform-rates` fetches shared FX and validates platform connectivity, storing per-platform entries in `platform_rates`.
	3. Calculator and dashboard pages consume `platform_rates` with live fallback when a platform’s own API can derive USD→NGN.

## Dashboard – Crypto Prices

- The main dashboard displays the top crypto prices (top-10) across platforms and their NGN equivalents (Binance may show USD only depending on available pairs).
- Individual platform pages:
	- CoinGecko, CoinMarketCap (CMC), CryptoCompare (CC), and Binance each display broader crypto prices and NGN equivalents where available.
	- Pages live under `app/dashboard/{platform}/page.tsx` with a unified Card + table UI.

## Calculator – Multi-Platform Currency Conversion

- A conversion tool combining crypto USD prices with USD→NGN rates.
- Behavior:
	- Per-platform live USD→NGN rate when available:
		- CoinGecko: BTC NGN/USD from CoinGecko → computes USD→NGN directly.
		- Binance: USDTNGN avg price from Binance API (if available).
		- CryptoCompare: Derives USD→NGN by combining BTC NGN (CoinGecko) and BTC USD (CryptoCompare).
		- CoinMarketCap: Derives USD→NGN by combining BTC NGN (CoinGecko) and BTC USD (CMC listings via `/api/coinmarketcap`).
	- Fallback: Uses the last stored DB rate from `platform_rates` if the live rate is not available immediately.
	- Stores live rates to the database via cron every ~5 minutes to ensure a consistent fallback.
	- UI shows badges per selected platform: “Live rate” when using live, otherwise “Last rate (DB)”.

## Rate Management Page

- Current Internal Crypto Rates: The agreed internal rates set by Cignum Solutions. These can be fixed per day or adjusted as needed.
- Internal API Keys: Keys used by the FX rate engine to load calculated rates. Recommendation: display only for admin users.
- Update Internal Crypto Rates: Form to set internal crypto rates (USDT/NGN buy/sell, USDT/USD, BTC prices). Saves to `internal_crypto_rates` and updates the internal platform rate.
- Update OTC Desk Configuration: Form to set USD/NGN desk costs and spread. Influences FX rate engine calculations.

## Data & APIs

- Supabase tables:
	- `platform_rates`: per-platform USD→NGN rates (columns include `platform_id`, `platform_name`, `rate_usd`, timestamps).
	- `internal_crypto_rates`: internal baseline crypto rates and timestamp.
	- Optional: `external_rate_sources` for vendor historical caching.

- Key API routes:
	- `/api/fx/vendors`: Fetches independent vendor FX sources (Wise, AbokiFX, CoinGecko FX, Binance USDT/USDC) with concise logging and DB fallback.
	- `/api/fx/platform-rates`: Returns DB platform rates; normalizes zeros and backfills missing platforms using vendor FX when needed.
	- `/api/coinmarketcap`: Server-side CMC listings (requires `CMC_API_KEY`).
	- `/api/fx/internal/*`: Internal endpoints for crypto rates and OTC desk settings.
	- `/api/cron/update-platform-rates`: Cron job to fetch shared FX, validate platforms, and persist rates.

## Configuration

- Environment variables:
	- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` for client usage.
	- `SUPABASE_SERVICE_ROLE_KEY` for server-side writes (API routes).
	- `CMC_API_KEY` for CoinMarketCap API access.
	- `CRON_SECRET` to authorize cron updates.
	- `NEXT_PUBLIC_INTERNAL_API_KEYS` comma-separated keys for internal engine.

## Operational Notes

- Live vs DB behavior: Calculator and dashboard prefer live rates per platform when possible; otherwise, they fall back to DB to ensure data is always shown.
- Logging: Vendors endpoint and platform-rates API include minimal logs to trace failures and fallbacks.
- UI Consistency: All platform dashboards use unified Card/table components and muted states for loading/error.

## Troubleshooting

- If `/api/fx/vendors` returns only one vendor (e.g., CoinGecko), ensure outbound network access and check logs for rejected promises.
- If calculator shows DB-only badges, the selected platform’s live derivation may be unavailable; verify platform connectivity and API keys where required.
- Preload CSS warning from Next.js is usually benign; audit `<link rel="preload" as="style">` usage in `app/layout.tsx` if needed.

## Future Enhancements

- Per-row live badges for all platforms (with throttled parallel live fetches).
- Admin-only visibility for internal API keys in Rate Management.
- More robust vendor weighting or reconciliation logic server-side (while keeping per-platform live derivations client-side).

Refer to `docs/FX_RATE_ENGINE_API.md` and `IMPLEMENTATION_SUMMARY.md` for deeper API details.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
