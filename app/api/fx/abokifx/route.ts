import { NextResponse } from "next/server";
import axios from "axios";

const TIMEOUT_MS = 3500;

type AbokiRatesEndpoint = "movement" | "lagos_previous" | "otherparallel" | "date";

type AbokiRateRow = {
  id?: number;
  currency_name?: string;
  currency_rate?: string;
  currency_type?: string;
  currency_flag?: string;
  created_at?: string;
  updated_at?: string;
};

type AbokiTimestampedRates = Record<string, AbokiRateRow[]>;

type AbokiRatesResponse = {
  response?: AbokiTimestampedRates | AbokiRateRow[];
};

function toNumberStrict(input: string): number | null {
  const cleaned = input.replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseCurrencyRate(raw: unknown): { buy: number | null; sell: number | null; raw: string } {
  const rawStr = typeof raw === "string" ? raw : "";
  // Aboki docs show values like "1650 / 1680*" (buy / sell) with trailing markers.
  const parts = rawStr.split("/").map((p) => p.trim());
  const left = parts[0] ?? "";
  const right = parts[1] ?? "";

  const leftNum = (left.match(/[\d,.]+/g) || []).map(toNumberStrict).find((n): n is number => !!n) ?? null;
  const rightNum = (right.match(/[\d,.]+/g) || []).map(toNumberStrict).find((n): n is number => !!n) ?? null;

  return { buy: leftNum, sell: rightNum, raw: rawStr };
}

function pickLatestTimestampKey(obj: AbokiTimestampedRates): string | null {
  const keys = Object.keys(obj);
  if (keys.length === 0) return null;
  // Timestamp format is "YYYY-MM-DD HH:mm:ss" which is lexicographically sortable.
  keys.sort();
  return keys[keys.length - 1] ?? null;
}

function findCurrencyRow(rows: AbokiRateRow[], currency: string): AbokiRateRow | null {
  const needle = currency.trim().toUpperCase();
  return rows.find((r) => String(r?.currency_name || "").trim().toUpperCase() === needle) ?? null;
}

async function fetchOfficialAbokiRates(opts: {
  token: string;
  endpoint: AbokiRatesEndpoint;
  date?: string;
  currency?: string;
}): Promise<AbokiRatesResponse> {
  const baseUrl = "https://abokifx.com/api/v1/rates";
  const url = `${baseUrl}/${opts.endpoint}`;

  const params: Record<string, string> = {};
  if (opts.endpoint === "date") {
    if (opts.date) params.date = opts.date;
    if (opts.currency) params.currency = opts.currency;
  }

  const res = await axios.get(url, {
    timeout: TIMEOUT_MS,
    params,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${opts.token}`,
    },
  });

  return res.data as AbokiRatesResponse;
}

function extractUsdNgnFromOfficial(payload: AbokiRatesResponse, currency: string): {
  buy: number | null;
  sell: number | null;
  timestamp: string | null;
  raw_rate: string | null;
} {
  const response = payload?.response;
  if (!response) {
    return { buy: null, sell: null, timestamp: null, raw_rate: null };
  }

  // For timestamped endpoints, response is an object keyed by timestamp.
  if (!Array.isArray(response)) {
    const ts = pickLatestTimestampKey(response);
    if (!ts) return { buy: null, sell: null, timestamp: null, raw_rate: null };
    const rows = response[ts] ?? [];
    const row = findCurrencyRow(rows, currency);
    if (!row?.currency_rate) return { buy: null, sell: null, timestamp: ts, raw_rate: null };
    const parsed = parseCurrencyRate(row.currency_rate);
    return { buy: parsed.buy, sell: parsed.sell, timestamp: ts, raw_rate: parsed.raw };
  }

  // For date endpoint, response is an array.
  const row = findCurrencyRow(response, currency);
  if (!row?.currency_rate) return { buy: null, sell: null, timestamp: null, raw_rate: null };
  const parsed = parseCurrencyRate(row.currency_rate);
  return { buy: parsed.buy, sell: parsed.sell, timestamp: null, raw_rate: parsed.raw };
}

function resolveMidRate(buy: number | null, sell: number | null): number | null {
  if (typeof buy === "number" && typeof sell === "number") return (buy + sell) / 2;
  return buy ?? sell ?? null;
}

function resolveSelectedRate(mode: "buy" | "sell" | "mid", buy: number | null, sell: number | null): number | null {
  if (mode === "buy") return buy ?? resolveMidRate(buy, sell);
  if (mode === "sell") return sell ?? resolveMidRate(buy, sell);
  return resolveMidRate(buy, sell);
}

function roundRate(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// Backward-compat fallback for older / unofficial endpoints
function extractLegacyRate(payload: unknown): number | null {
  const data = payload as Record<string, any>;

  const candidates = [
    data?.data?.buy_rate,
    data?.buy_rate,
    data?.data?.rate,
    data?.rate,
    data?.usd_ngn,
    data?.usd?.ngn,
    data?.USD?.NGN,
  ];

  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return null;
}

async function fetchLegacyAboki(apiKey?: string): Promise<{ rate: number; source: string } | null> {
  const urls = [
    "https://abokifx-api.vercel.app/api/usd",
    "https://api.abokifx.com/rates",
  ];

  // Try key-based request first if provided (some deployments accept it)
  if (apiKey) {
    const attempts: Array<{ headers: Record<string, string>; source: string }> = [
      { headers: { "X-API-KEY": apiKey }, source: "abokifx" },
      { headers: { Authorization: `Bearer ${apiKey}` }, source: "abokifx" },
    ];

    for (const attempt of attempts) {
      try {
        const res = await axios.get(urls[1], { headers: attempt.headers, timeout: TIMEOUT_MS });
        const rate = extractLegacyRate(res.data);
        if (rate) return { rate, source: attempt.source };
      } catch {
        // try next
      }
    }
  }

  // Public fallbacks
  for (const url of urls) {
    try {
      const res = await axios.get(url, { timeout: TIMEOUT_MS });
      const rate = extractLegacyRate(res.data);
      if (rate) return { rate, source: url.includes("vercel.app") ? "abokifx-api" : "abokifx" };
    } catch {
      // try next
    }
  }

  return null;
}

/**
 * GET /api/fx/abokifx
 * Returns Aboki FX USD/NGN rate as a vendor object.
 */
export async function GET(request: Request) {
  try {
    const reqUrl = new URL(request.url);
    const authToken = process.env.ABOKI_FX_AUTH_TOKEN;
    const legacyKey = process.env.ABOKI_FX_API_KEY;

    // Some setups historically stored the Bearer token in ABOKI_FX_API_KEY.
    // If ABOKI_FX_AUTH_TOKEN is missing, try using ABOKI_FX_API_KEY as the token.
    const bearerToken = authToken || legacyKey || "";

    // Defaults for calculator usage; allow overriding via query params
    const endpointParam = (reqUrl.searchParams.get("endpoint") || "movement").toLowerCase();
    const endpoint: AbokiRatesEndpoint =
      endpointParam === "lagos_previous" || endpointParam === "otherparallel" || endpointParam === "date"
        ? (endpointParam as AbokiRatesEndpoint)
        : "movement";
    const currency = (reqUrl.searchParams.get("currency") || "USD").toUpperCase();
    const date = reqUrl.searchParams.get("date") || undefined;
    const modeParam = (reqUrl.searchParams.get("mode") || "mid").toLowerCase();
    const mode: "buy" | "sell" | "mid" = modeParam === "buy" || modeParam === "sell" ? (modeParam as any) : "mid";

    // Prefer official Aboki API when a Bearer token is available.
    // If it fails (auth/network/parsing), fall back to legacy/community sources.
    if (bearerToken) {
      try {
        const official = await fetchOfficialAbokiRates({ token: bearerToken, endpoint, currency, date });
        const extracted = extractUsdNgnFromOfficial(official, currency);
        const selected = resolveSelectedRate(mode, extracted.buy, extracted.sell);

        if (selected) {
          // Official Aboki UI often shows 4dp precision.
          const roundedSelected = roundRate(selected, 4);
          const mid = resolveMidRate(extracted.buy, extracted.sell);
          const roundedMid = mid ? roundRate(mid, 4) : null;
          const roundedBuy = extracted.buy ? roundRate(extracted.buy, 4) : null;
          const roundedSell = extracted.sell ? roundRate(extracted.sell, 4) : null;

          return NextResponse.json(
            {
              name: "AbokiFX",
              rate: roundedSelected,
              mode,
              mid_rate: roundedMid,
              buy_rate: roundedBuy,
              sell_rate: roundedSell,
              currency,
              endpoint,
              timestamp: extracted.timestamp,
              raw_rate: extracted.raw_rate,
              source: "abokifx.com",
              updated_at: new Date().toISOString(),
            },
            {
              headers: {
                "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
              },
            }
          );
        }
      } catch {
        // fall back below
      }
    }

    // Fallback to legacy/community endpoints if token missing or official parsing failed.
    const legacy = await fetchLegacyAboki(legacyKey);
    if (!legacy) {
      return NextResponse.json(
        {
          name: "AbokiFX",
          rate: null,
          mid_rate: null,
          buy_rate: null,
          sell_rate: null,
          currency: "USD",
          endpoint: "movement",
          timestamp: null,
          raw_rate: null,
          source: "abokifx",
          updated_at: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        name: "AbokiFX",
        rate: Math.round(legacy.rate * 100) / 100,
        mode,
        mid_rate: Math.round(legacy.rate * 100) / 100,
        buy_rate: null,
        sell_rate: null,
        currency: "USD",
        endpoint: "movement",
        timestamp: null,
        raw_rate: null,
        source: legacy.source,
        updated_at: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("[API] AbokiFX route failed:", err);
    return NextResponse.json(
      {
        name: "AbokiFX",
        rate: null,
        mid_rate: null,
        buy_rate: null,
        sell_rate: null,
        currency: "USD",
        endpoint: "movement",
        timestamp: null,
        raw_rate: null,
        source: "abokifx",
        updated_at: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
