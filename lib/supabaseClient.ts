// lib/supabaseClient.ts
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!url || !anonKey) {
  // Fail fast in dev so you notice env config issues
  // But don't throw in production builds; instead warn (optional)
  // remove the throw if you prefer non-blocking behavior
  console.warn("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase: SupabaseClient = createClient(url, anonKey);

export type SupabaseUser = User | null;
