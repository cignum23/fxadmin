import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const KEY_PREFIX = "fxr_live";
const SECRET_BYTES = 32;

export type GeneratedRateReadKey = {
  key: string;
  keyPrefix: string;
  keyHash: string;
};

export type RateReadKeyRecord = {
  id: string;
  name: string;
  key_prefix: string;
  status: "active" | "revoked";
  notes: string | null;
  created_by_email: string | null;
  created_at: string;
  last_used_at: string | null;
  last_used_ip: string | null;
  revoked_at: string | null;
};

export type RateReadKeyVerification = {
  valid: boolean;
  identifier: string;
  record?: Pick<RateReadKeyRecord, "id" | "key_prefix" | "status">;
};

export function generateRateReadApiKey(): GeneratedRateReadKey {
  const suffix = randomBytes(6).toString("hex");
  const secret = randomBytes(SECRET_BYTES).toString("base64url");
  const keyPrefix = `${KEY_PREFIX}_${suffix}`;
  const key = `${keyPrefix}_${secret}`;

  return {
    key,
    keyPrefix,
    keyHash: hashRateReadApiKey(key),
  };
}

export function hashRateReadApiKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

export function extractRateReadKeyPrefix(key: string): string | null {
  const parts = key.trim().split("_");
  if (parts.length < 4 || parts[0] !== "fxr" || parts[1] !== "live") {
    return null;
  }

  return parts.slice(0, 3).join("_");
}

export function getBearerOrApiKey(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  return request.headers.get("x-api-key")?.trim() || null;
}

function safeHashEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function verifyStoredRateReadKey(
  key: string | null | undefined,
  ip: string
): Promise<RateReadKeyVerification> {
  if (!key) return { valid: false, identifier: "anonymous" };

  const keyPrefix = extractRateReadKeyPrefix(key);
  if (!keyPrefix) return { valid: false, identifier: "invalid-key-format" };

  const { data, error } = await supabaseAdmin
    .from("rate_read_api_keys")
    .select("id, key_prefix, key_hash, status")
    .eq("key_prefix", keyPrefix)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn("rate_read_api_keys lookup failed:", error.message);
    return { valid: false, identifier: keyPrefix };
  }

  const requestedHash = hashRateReadApiKey(key);
  const isValid = data.status === "active" && safeHashEquals(requestedHash, data.key_hash);

  if (isValid) {
    void supabaseAdmin
      .from("rate_read_api_keys")
      .update({ last_used_at: new Date().toISOString(), last_used_ip: ip })
      .eq("id", data.id);
  }

  return {
    valid: isValid,
    identifier: data.id,
    record: {
      id: data.id,
      key_prefix: data.key_prefix,
      status: data.status,
    },
  };
}
