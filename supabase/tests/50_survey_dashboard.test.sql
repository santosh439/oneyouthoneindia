\set ON_ERROR_STOP 0
-- Builds on 30_city_survey: Bengaluru, Karnataka has 3 responses there.
reset role; set role anon; set request.jwt.claim.sub = '';
select 'D1 state meter for Karnataka' t, count(*)=1 and min(responses)=3 ok from public.state_meter() where state ilike 'karnataka';
select 'D2 state score in range' t, bool_and(score between 0 and 100) ok from public.state_meter();
select 'D3 trend has weeks with responses' t, coalesce(sum(responses),0)=3 ok from public.survey_trend(12);
reset role;
insert into auth.users (id,email) values ('00000000-0000-0000-0000-0000000000f1','f1@x'),('00000000-0000-0000-0000-0000000000f2','f2@x') on conflict do nothing;
insert into public.city_survey (user_id,state,city,scores) values ('00000000-0000-0000-0000-0000000000f1','Kerala','Kochi','{"roads":4,"water":4,"power":4}'),('00000000-0000-0000-0000-0000000000f2','Kerala','Kochi','{"roads":5,"water":5,"power":5}');
set role anon;
select 'D5 state below 3 responses hidden' t, count(*)=0 ok from public.state_meter() where state='Kerala';
