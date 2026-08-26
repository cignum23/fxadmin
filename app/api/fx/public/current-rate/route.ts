import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIp } from "@/lib/fx-engine/utils/rate-limiter";
import { getBearerOrApiKey, verifyStoredRateReadKey } from "@/lib/fx-engine/utils/rate-read-keys";
import { verifyRateReadKey } from "@/lib/fx-engine/utils/auth";

const DEFAULT_STALE_MINUTES = 30;
const DEFAULT_PUBLIC_RATE_LIMIT_PER_MINUTE = 600;

function parseSupabaseTimestamp(value: string): Date {
  // Supabase returns `timestamp without time zone` without an offset; the app writes UTC ISO values.
  const hasTimezone = /(?:z|[+-]\d{2}:\d{2})$/i.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const key = getBearerOrApiKey(request);
  const storedKey = await verifyStoredRateReadKey(key, ip);

  if (!storedKey.valid && !verifyRateReadKey(key)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configuredPublicLimit = Number(process.env.FX_PUBLIC_RATE_LIMIT_PER_MINUTE);
  const publicRateLimit = Number.isFinite(configuredPublicLimit) && configuredPublicLimit > 0
    ? configuredPublicLimit
    : DEFAULT_PUBLIC_RATE_LIMIT_PER_MINUTE;
  const keyScope = storedKey.valid ? storedKey.identifier : "env-read-key";
  const rateLimitIdentifier = `public-current-rate:v2:${keyScope}:${ip}`;

  if (!(await checkRateLimit(rateLimitIdentifier, publicRateLimit))) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(publicRateLimit),
        },
      }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("fx_rate_calculations")
    .select("id, timestamp, final_usd_ngn_rate, calculation_method, created_at")
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to fetch current rate" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "No current FX rate is available" }, { status: 503 });
  }

  const asOf = parseSupabaseTimestamp(String(data.timestamp));
  const staleAfterMinutes = Number(process.env.FX_PUBLIC_RATE_STALE_MINUTES) || DEFAULT_STALE_MINUTES;
  const stale = Date.now() - asOf.getTime() > staleAfterMinutes * 60 * 1000;

  return NextResponse.json(
    {
      base: "USD",
      quote: "NGN",
      rate: Number(data.final_usd_ngn_rate),
      asOf: asOf.toISOString(),
      stale,
      source: "fxadmin",
      calculationMethod: data.calculation_method,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=15",
        "X-RateLimit-Limit": String(publicRateLimit),
      },
    }
  );
}
