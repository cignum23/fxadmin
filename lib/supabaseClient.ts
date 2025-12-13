// lib/supabaseClient.ts
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? "";

if (!url || !publishableKey) {
  // Fail fast in dev so you notice env config issues
  // But don't throw in production builds; instead warn (optional)
  // remove the throw if you prefer non-blocking behavior
  console.warn("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");
}

export const supabase: SupabaseClient = createClient(url, publishableKey);

export type SupabaseUser = User | null;
