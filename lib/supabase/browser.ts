// lib/supabase/browser.ts
// Cookie-backed browser client (as opposed to lib/supabaseClient.ts's plain
// localStorage-backed client) so the session is visible to middleware.ts and
// server-side route handlers for /dashboard and /api/fx/internal gating.
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? ""
  );
}
