-- One Youth One India: migration 006
-- All India Survey Dashboard: State level results and weekly trends (aggregates only).
-- Run ONCE in Supabase SQL Editor (after 004). Safe to re-run.

-- State results: only States with at least 3 responses, so no individual can be identified.
create or replace function public.state_meter(p_min int default 3)
returns table (state text, responses bigint, cities bigint, score numeric, dims jsonb)
language sql stable security definer set search_path = public as $$
  with per as (
    select lower(state) as k, min(state) as state, count(*) as n, count(distinct city_key) as c
    from public.city_survey group by lower(state) having count(*) >= greatest(p_min, 3)
  ), d as (
    select lower(s.state) as k, e.key, avg((e.value)::numeric) as a
    from public.city_survey s cross join jsonb_each(s.scores) e
    where lower(s.state) in (select k from per) group by lower(s.state), e.key
  )
  select per.state, per.n, per.c, round(((avg(d.a) - 1) / 4 * 100)::numeric, 1),
         jsonb_object_agg(d.key, round(((d.a - 1) / 4 * 100)::numeric, 1))
  from per join d on d.k = per.k group by per.state, per.n, per.c order by 4 desc;
$$;
grant execute on function public.state_meter to anon, authenticated;

-- Weekly responses and average score for the last N weeks (by last update).
create or replace function public.survey_trend(p_weeks int default 12)
returns table (week date, responses bigint, score numeric)
language sql stable security definer set search_path = public as $$
  with w as (
    select date_trunc('week', updated_at)::date as week, scores from public.city_survey
    where updated_at >= date_trunc('week', now()) - make_interval(weeks => least(greatest(p_weeks, 1), 52) - 1)
  ), v as (select w.week, (e.value)::numeric as val from w cross join jsonb_each(w.scores) e)
  select w.week, count(*), (select round(((avg(val) - 1) / 4 * 100)::numeric, 1) from v where v.week = w.week)
  from w group by w.week order by w.week;
$$;
grant execute on function public.survey_trend to anon, authenticated;
