// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

/* FIX: Validate environment variables before creating client.
   This avoids unhelpful runtime exceptions and helps to fail fast when
   env vars are missing. */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase env not set. Some features that depend on Supabase will fail. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabasePublishableKey ?? "");
