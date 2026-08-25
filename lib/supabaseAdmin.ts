// lib/supabaseAdmin.ts
// Service-role Supabase client — server-only, bypasses RLS. Use this (never
// the anon client) for API routes that write rate/margin data, since RLS
// now restricts INSERT/UPDATE/DELETE on those tables to the service role.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!serviceRoleKey) {
  console.warn(
    "Missing SUPABASE_SERVICE_ROLE_KEY — server-side writes to rate/margin tables will fail once RLS is locked to service_role."
  );
}

export const supabaseAdmin: SupabaseClient = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
