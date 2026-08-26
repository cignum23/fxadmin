import axios from "axios";

export const ABOKI_TIMEOUT_MS = 3500;

export type AbokiRatesEndpoint = "movement" | "lagos_previous" | "otherparallel" | "date";
export type AbokiRateMode = "buy" | "sell" | "mid";

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

export type AbokiFxRateResult = {
  name: "AbokiFX";
  rate: number | null;
  mode: AbokiRateMode;
  mid_rate: number | null;
  buy_rate: number | null;
  sell_rate: number | null;
  currency: string;
  endpoint: AbokiRatesEndpoint;
  timestamp: string | null;
  raw_rate: string | null;
  source: string;
  updated_at: string;
};

function toNumberStrict(input: string): number | null {
  const cleaned = input.replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseCurrencyRate(raw: unknown): { buy: number | null; sell: number | null; raw: string } {
  const rawStr = typeof raw === "string" ? raw : "";
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
  const params: Record<string, string> = {};

  if (opts.endpoint === "date") {
    if (opts.date) params.date = opts.date;
    if (opts.currency) params.currency = opts.currency;
  }

  const res = await axios.get(`${baseUrl}/${opts.endpoint}`, {
    timeout: ABOKI_TIMEOUT_MS,
    params,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${opts.token}`,
    },
  });

  return res.data as AbokiRatesResponse;
}

function extractUsdNgnFromOfficial(
  payload: AbokiRatesResponse,
  currency: string
): { buy: number | null; sell: number | null; timestamp: string | null; raw_rate: string | null } {
  const response = payload?.response;
  if (!response) return { buy: null, sell: null, timestamp: null, raw_rate: null };

  if (!Array.isArray(response)) {
    const ts = pickLatestTimestampKey(response);
    if (!ts) return { buy: null, sell: null, timestamp: null, raw_rate: null };
    const rows = response[ts] ?? [];
    const row = findCurrencyRow(rows, currency);
    if (!row?.currency_rate) return { buy: null, sell: null, timestamp: ts, raw_rate: null };
    const parsed = parseCurrencyRate(row.currency_rate);
    return { buy: parsed.buy, sell: parsed.sell, timestamp: ts, raw_rate: parsed.raw };
  }

  const row = findCurrencyRow(response, currency);
  if (!row?.currency_rate) return { buy: null, sell: null, timestamp: null, raw_rate: null };
  const parsed = parseCurrencyRate(row.currency_rate);
  return { buy: parsed.buy, sell: parsed.sell, timestamp: null, raw_rate: parsed.raw };
}

function resolveMidRate(buy: number | null, sell: number | null): number | null {
  if (typeof buy === "number" && typeof sell === "number") return (buy + sell) / 2;
  return buy ?? sell ?? null;
}

function resolveSelectedRate(mode: AbokiRateMode, buy: number | null, sell: number | null): number | null {
  if (mode === "buy") return buy ?? resolveMidRate(buy, sell);
  if (mode === "sell") return sell ?? resolveMidRate(buy, sell);
  return resolveMidRate(buy, sell);
}

function roundRate(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function extractLegacyRate(payload: unknown): number | null {
  const data = payload as {
    data?: Record<string, unknown>;
    buy_rate?: unknown;
    rate?: unknown;
    usd_ngn?: unknown;
    usd?: Record<string, unknown>;
    USD?: Record<string, unknown>;
  };

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

  if (apiKey) {
    const attempts: Array<{ headers: Record<string, string>; source: string }> = [
      { headers: { "X-API-KEY": apiKey }, source: "abokifx" },
      { headers: { Authorization: `Bearer ${apiKey}` }, source: "abokifx" },
    ];

    for (const attempt of attempts) {
      try {
        const res = await axios.get(urls[1], { headers: attempt.headers, timeout: ABOKI_TIMEOUT_MS });
        const rate = extractLegacyRate(res.data);
        if (rate) return { rate, source: attempt.source };
      } catch {
        // Try the next compatible legacy authorization style.
      }
    }
  }

  for (const url of urls) {
    try {
      const res = await axios.get(url, { timeout: ABOKI_TIMEOUT_MS });
      const rate = extractLegacyRate(res.data);
      if (rate) return { rate, source: url.includes("vercel.app") ? "abokifx-api" : "abokifx" };
    } catch {
      // Try the next public fallback endpoint.
    }
  }

  return null;
}

export async function fetchAbokiFxRate(opts: {
  endpoint?: AbokiRatesEndpoint;
  currency?: string;
  date?: string;
  mode?: AbokiRateMode;
} = {}): Promise<AbokiFxRateResult> {
  const endpoint = opts.endpoint ?? "movement";
  const currency = (opts.currency ?? "USD").toUpperCase();
  const mode = opts.mode ?? "mid";
  const authToken = process.env.ABOKI_FX_AUTH_TOKEN;
  const legacyKey = process.env.ABOKI_FX_API_KEY;
  const bearerToken = authToken || legacyKey || "";

  // Prefer the official Aboki feed when configured, then fall back to legacy/community sources.
  if (bearerToken) {
    try {
      const official = await fetchOfficialAbokiRates({ token: bearerToken, endpoint, currency, date: opts.date });
      const extracted = extractUsdNgnFromOfficial(official, currency);
      const selected = resolveSelectedRate(mode, extracted.buy, extracted.sell);

      if (selected) {
        const mid = resolveMidRate(extracted.buy, extracted.sell);
        return {
          name: "AbokiFX",
          rate: roundRate(selected, 4),
          mode,
          mid_rate: mid ? roundRate(mid, 4) : null,
          buy_rate: extracted.buy ? roundRate(extracted.buy, 4) : null,
          sell_rate: extracted.sell ? roundRate(extracted.sell, 4) : null,
          currency,
          endpoint,
          timestamp: extracted.timestamp,
          raw_rate: extracted.raw_rate,
          source: "abokifx.com",
          updated_at: new Date().toISOString(),
        };
      }
    } catch {
      // Fall through to legacy/community endpoints if official Aboki is unavailable.
    }
  }

  const legacy = await fetchLegacyAboki(legacyKey);
  if (!legacy) {
    return {
      name: "AbokiFX",
      rate: null,
      mode,
      mid_rate: null,
      buy_rate: null,
      sell_rate: null,
      currency,
      endpoint,
      timestamp: null,
      raw_rate: null,
      source: "abokifx",
      updated_at: new Date().toISOString(),
    };
  }

  const rounded = roundRate(legacy.rate, 2);
  return {
    name: "AbokiFX",
    rate: rounded,
    mode,
    mid_rate: rounded,
    buy_rate: null,
    sell_rate: null,
    currency,
    endpoint,
    timestamp: null,
    raw_rate: null,
    source: legacy.source,
    updated_at: new Date().toISOString(),
  };
}
