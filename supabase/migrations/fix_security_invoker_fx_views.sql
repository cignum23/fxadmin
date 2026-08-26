-- Resolve Supabase Security Advisor lint 0010 for public FX views.
-- SECURITY INVOKER makes the views execute with the querying role so RLS is honored.
alter view if exists public.latest_fx_rate
  set (security_invoker = true);

alter view if exists public.hourly_fx_rates
  set (security_invoker = true);
