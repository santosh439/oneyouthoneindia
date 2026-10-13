-- One Youth One India: migration 004
-- All India City Survey and City Meter.
-- Run ONCE in Supabase SQL Editor (after 002 and 003). Safe to re-run.

-- One response per person per city; people can update their answers at any time.
create table if not exists public.city_survey (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  state text not null check (char_length(state) between 2 and 60),
  district text check (char_length(district) <= 80),
  city text not null check (char_length(city) between 2 and 80),
  city_key text generated always as (lower(trim(state)) || '|' || lower(trim(city))) stored,
  scores jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, city_key)
);
create index if not exists city_survey_city_idx on public.city_survey (city_key);

-- Every score must be a whole number from 1 to 5, for known services only.
create or replace function public.valid_city_scores(s jsonb) returns boolean
language sql immutable as $$
  select jsonb_typeof(s) = 'object'
    and (select count(*) from jsonb_object_keys(s)) between 3 and 12
    and not exists (
      select 1 from jsonb_each(s) e
      where e.key not in ('roads', 'water', 'power', 'cleanliness', 'safety', 'transport', 'health', 'education', 'governance', 'environment')
         or jsonb_typeof(e.value) <> 'number' or (e.value)::numeric not in (1, 2, 3, 4, 5)
    );
$$;
alter table public.city_survey drop constraint if exists city_survey_scores_check;
alter table public.city_survey add constraint city_survey_scores_check check (public.valid_city_scores(scores));

create or replace function public.city_survey_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); new.user_id := old.user_id; return new; end; $$;
drop trigger if exists city_survey_touch on public.city_survey;
create trigger city_survey_touch before update on public.city_survey for each row execute function public.city_survey_touch();

alter table public.city_survey enable row level security;
-- Individual answers are private: people see and change only their own.
drop policy if exists "survey read own" on public.city_survey;
create policy "survey read own" on public.city_survey for select using (user_id = auth.uid());
drop policy if exists "survey insert own" on public.city_survey;
create policy "survey insert own" on public.city_survey for insert with check (user_id = auth.uid());
drop policy if exists "survey update own" on public.city_survey;
create policy "survey update own" on public.city_survey for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "survey delete own" on public.city_survey;
create policy "survey delete own" on public.city_survey for delete using (user_id = auth.uid());

-- Public results: aggregates only, and only for cities with enough responses
-- (default 3) so no single person's answers can be identified.
create or replace function public.city_meter(p_min int default 3)
returns table (state text, city text, district text, responses bigint, score numeric, dims jsonb, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  with per as (
    select city_key, min(state) as state, min(city) as city, mode() within group (order by district) as district,
           count(*) as n, max(updated_at) as updated_at
    from public.city_survey group by city_key having count(*) >= greatest(p_min, 3)
  ), dims as (
    select s.city_key, e.key, avg((e.value)::numeric) as a
    from public.city_survey s cross join jsonb_each(s.scores) e
    where s.city_key in (select city_key from per) group by s.city_key, e.key
  )
  select per.state, per.city, per.district, per.n,
         round(((avg(d.a) - 1) / 4 * 100)::numeric, 1) as score,
         jsonb_object_agg(d.key, round(((d.a - 1) / 4 * 100)::numeric, 1)) as dims,
         per.updated_at
  from per join dims d on d.city_key = per.city_key
  group by per.state, per.city, per.district, per.n, per.updated_at
  order by score desc;
$$;
grant execute on function public.city_meter to anon, authenticated;

-- All India totals across every response (no threshold needed for national averages).
create or replace function public.india_meter()
returns table (responses bigint, cities bigint, states bigint, score numeric, dims jsonb)
language sql stable security definer set search_path = public as $$
  with d as (select e.key, avg((e.value)::numeric) as a from public.city_survey s cross join jsonb_each(s.scores) e group by e.key)
  select (select count(*) from public.city_survey), (select count(distinct city_key) from public.city_survey), (select count(distinct lower(state)) from public.city_survey),
         (select round(((avg(a) - 1) / 4 * 100)::numeric, 1) from d),
         (select coalesce(jsonb_object_agg(key, round(((a - 1) / 4 * 100)::numeric, 1)), '{}'::jsonb) from d);
$$;
grant execute on function public.india_meter to anon, authenticated;

-- Realtime so the meter updates live as responses arrive.
do $$ begin
  begin alter publication supabase_realtime add table public.city_survey; exception when duplicate_object then null; end;
end $$;
