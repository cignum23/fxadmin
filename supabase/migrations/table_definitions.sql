
create table public.external_rate_sources (
  id uuid not null default gen_random_uuid (),
  timestamp timestamp without time zone not null default now(),
  source_name character varying(50) not null,
  usd_ngn_rate numeric(10, 2) null,
  status character varying(20) null,
  response_time_ms integer null,
  raw_data jsonb null,
  created_at timestamp without time zone null default now(),
  constraint external_rate_sources_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_ext_source_timestamp on public.external_rate_sources using btree ("timestamp" desc) TABLESPACE pg_default;

create index IF not exists idx_ext_source_name on public.external_rate_sources using btree (source_name) TABLESPACE pg_default;

-- Enable RLS on external_rate_sources
ALTER TABLE external_rate_sources ENABLE ROW LEVEL SECURITY;

-- Allow public read access (rates are public data)
CREATE POLICY "Allow public read access to external_rate_sources"
  ON external_rate_sources
  FOR SELECT
  USING (true);

-- Allow service role to insert
CREATE POLICY "Allow service role to insert external_rate_sources"
  ON external_rate_sources
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR true);

-- Allow service role to update
CREATE POLICY "Allow service role to update external_rate_sources"
  ON external_rate_sources
  FOR UPDATE
  USING (auth.role() = 'service_role' OR true)
  WITH CHECK (auth.role() = 'service_role' OR true);

-- Allow service role to delete
CREATE POLICY "Allow service role to delete external_rate_sources"
  ON external_rate_sources
  FOR DELETE
  USING (auth.role() = 'service_role' OR true);
-----------
create table public.fx_rate_calculations (
  id uuid not null default gen_random_uuid (),
  timestamp timestamp without time zone not null default now(),
  baseline_rate numeric(10, 2) not null,
  crypto_implied_rate numeric(10, 2) null,
  crypto_premium numeric(10, 2) null,
  liquidity_spread numeric(10, 2) null,
  desk_spread numeric(10, 2) null,
  final_usd_ngn_rate numeric(10, 2) not null,
  calculation_method text null,
  raw_sources jsonb null,
  created_at timestamp without time zone null default now(),
  constraint fx_rate_calculations_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_fx_calc_timestamp on public.fx_rate_calculations using btree ("timestamp" desc) TABLESPACE pg_default;

create index IF not exists idx_fx_calc_final_rate on public.fx_rate_calculations using btree (final_usd_ngn_rate) TABLESPACE pg_default;

-- Enable RLS on fx_rate_calculations
ALTER TABLE fx_rate_calculations ENABLE ROW LEVEL SECURITY;

-- Allow public read access (rates are public data)
CREATE POLICY "Allow public read access to fx_rate_calculations"
  ON fx_rate_calculations
  FOR SELECT
  USING (true);

-- Allow service role to insert
CREATE POLICY "Allow service role to insert fx_rate_calculations"
  ON fx_rate_calculations
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR true);

-- Allow service role to update
CREATE POLICY "Allow service role to update fx_rate_calculations"
  ON fx_rate_calculations
  FOR UPDATE
  USING (auth.role() = 'service_role' OR true)
  WITH CHECK (auth.role() = 'service_role' OR true);

-- Allow service role to delete
CREATE POLICY "Allow service role to delete fx_rate_calculations"
  ON fx_rate_calculations
  FOR DELETE
  USING (auth.role() = 'service_role' OR true);
-----------
create view public.hourly_fx_rates as
select
  date_trunc('hour'::text, "timestamp") as hour,
  avg(final_usd_ngn_rate) as avg_rate,
  min(final_usd_ngn_rate) as min_rate,
  max(final_usd_ngn_rate) as max_rate,
  count(*) as sample_count
from
  fx_rate_calculations
group by
  (date_trunc('hour'::text, "timestamp"))
order by
  (date_trunc('hour'::text, "timestamp")) desc;
-----------
create view public.latest_fx_rate as
select
  id,
  "timestamp",
  baseline_rate,
  crypto_implied_rate,
  crypto_premium,
  liquidity_spread,
  desk_spread,
  final_usd_ngn_rate,
  calculation_method,
  raw_sources,
  created_at
from
  fx_rate_calculations
order by
  "timestamp" desc
limit
  1;
-----------
create table public.otc_desk_rates (
  id uuid not null default gen_random_uuid (),
  timestamp timestamp without time zone not null default now(),
  usd_cost numeric(10, 2) not null,
  ngn_cost numeric(10, 2) null,
  desk_spread numeric(10, 2) not null,
  updated_by character varying(100) null,
  created_at timestamp without time zone null default now(),
  constraint otc_desk_rates_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_otc_timestamp on public.otc_desk_rates using btree ("timestamp" desc) TABLESPACE pg_default;
------------
create table public.rate_calculation_logs (
  id uuid not null default gen_random_uuid (),
  timestamp timestamp without time zone not null default now(),
  level character varying(20) not null,
  message text not null,
  context jsonb null,
  created_at timestamp without time zone null default now(),
  constraint rate_calculation_logs_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_logs_timestamp on public.rate_calculation_logs using btree ("timestamp" desc) TABLESPACE pg_default;

create index IF not exists idx_logs_level on public.rate_calculation_logs using btree (level) TABLESPACE pg_default;