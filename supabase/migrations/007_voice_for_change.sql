-- One Youth One India: migration 007 "Voice for Change"
-- Government and private sector experiences, organisation directory, organisation representatives,
-- verified responses, new feedback lifecycle, further review, helpful votes.
-- Run ONCE in Supabase SQL Editor after 002 to 006. Safe to re-run.

-- ============ 1. Feedback lifecycle ============
-- Submitted > Under review > Assigned > Response awaited > Action in progress > Outcome provided > Closed
alter table public.posts drop constraint if exists posts_status_check;
update public.posts set status = case status
  when 'Open' then 'Submitted' when 'Acknowledged' then 'Under review' when 'In progress' then 'Action in progress'
  when 'Resolved' then 'Outcome provided' when 'Rejected' then 'Closed' else status end
where status in ('Open', 'Acknowledged', 'In progress', 'Resolved', 'Rejected');
alter table public.posts alter column status set default 'Submitted';
alter table public.posts add constraint posts_status_check check (status in (
  'Submitted', 'Under review', 'Assigned', 'Response awaited', 'Action in progress', 'Outcome provided', 'Closed'));

-- ============ 2. New fields on every experience ============
alter table public.posts add column if not exists sector text not null default 'government';
alter table public.posts drop constraint if exists posts_sector_check;
alter table public.posts add constraint posts_sector_check check (sector in ('government', 'private'));
alter table public.posts add column if not exists organization_id uuid;
alter table public.posts add column if not exists experience_date date;
alter table public.posts drop constraint if exists posts_experience_date_check;
alter table public.posts add constraint posts_experience_date_check check (experience_date is null or experience_date between date '2000-01-01' and current_date + 1);
alter table public.posts add column if not exists suggestion text;
alter table public.posts drop constraint if exists posts_suggestion_check;
alter table public.posts add constraint posts_suggestion_check check (suggestion is null or char_length(suggestion) <= 1000);
alter table public.posts add column if not exists service_location text;
alter table public.posts drop constraint if exists posts_service_location_check;
alter table public.posts add constraint posts_service_location_check check (service_location is null or char_length(service_location) <= 160);
alter table public.posts add column if not exists further_reviews int not null default 0;
alter table public.posts add column if not exists status_changed_at timestamptz not null default now();
create index if not exists posts_sector_idx on public.posts (sector, created_at desc);
create index if not exists posts_org_idx on public.posts (organization_id);

-- Old seed rows from the very first prototype are never shown publicly.
update public.posts set hidden = true where sample = true and hidden = false;

-- ============ 3. Organisation directory ============
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  sector text not null check (sector in ('government', 'private')),
  category text check (char_length(category) <= 60),
  subcategory text check (char_length(subcategory) <= 80),
  state text check (char_length(state) <= 60),
  district text check (char_length(district) <= 80),
  city text check (char_length(city) <= 80),
  website text check (website is null or website ~ '^https://'),
  source_label text check (char_length(source_label) <= 160),
  source_url text check (source_url is null or source_url ~ '^https://'),
  verified boolean not null default false,
  last_verified_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_by uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name_key text generated always as (lower(regexp_replace(trim(name), '\s+', ' ', 'g'))) stored
);
alter table public.organizations drop constraint if exists organizations_verified_source;
alter table public.organizations add constraint organizations_verified_source check (not verified or (source_url is not null and last_verified_at is not null));
create unique index if not exists organizations_unique on public.organizations (name_key, sector, coalesce(lower(state), ''), coalesce(lower(city), ''));
create index if not exists organizations_search on public.organizations (sector, status, name_key);
do $$ begin
  alter table public.posts add constraint posts_organization_fk foreign key (organization_id) references public.organizations on delete set null;
exception when duplicate_object then null; end $$;

alter table public.organizations enable row level security;
drop policy if exists "orgs read" on public.organizations;
create policy "orgs read" on public.organizations for select using (status = 'published' or created_by = auth.uid() or public.can_edit_content() or public.is_mod());
-- Signed in users may suggest an organisation; it stays pending and unverified until staff review it.
drop policy if exists "orgs suggest" on public.organizations;
create policy "orgs suggest" on public.organizations for insert with check (
  auth.uid() is not null and (
    public.can_edit_content()
    or (created_by = auth.uid() and status = 'pending' and verified = false and last_verified_at is null and source_url is null)
  ));
drop policy if exists "orgs manage" on public.organizations;
create policy "orgs manage" on public.organizations for update using (public.can_edit_content()) with check (public.can_edit_content());
drop policy if exists "orgs delete" on public.organizations;
create policy "orgs delete" on public.organizations for delete using (public.is_admin());

create or replace function public.org_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;
drop trigger if exists org_touch on public.organizations;
create trigger org_touch before update on public.organizations for each row execute function public.org_touch();

-- Import official government organisations (from the site's checked directory). Admins and content managers only.
-- Existing records are updated in place (no duplicates); records edited by staff keep their status.
create or replace function public.org_import(p_rows jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare r jsonb; n int := 0;
begin
  if not public.can_edit_content() then raise exception 'not authorised'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    insert into public.organizations (name, sector, category, state, website, source_label, source_url, verified, last_verified_at, status, created_by)
    values (r->>'name', coalesce(r->>'sector', 'government'), r->>'category', nullif(r->>'state', ''), r->>'website', r->>'source_label', r->>'source_url',
            coalesce((r->>'verified')::boolean, false), nullif(r->>'verified_at', '')::timestamptz, 'published', auth.uid())
    on conflict (name_key, sector, coalesce(lower(state), ''), coalesce(lower(city), '')) do update set
      website = excluded.website, source_label = excluded.source_label, source_url = excluded.source_url, category = excluded.category,
      verified = excluded.verified or organizations.verified, last_verified_at = greatest(excluded.last_verified_at, organizations.last_verified_at);
    n := n + 1;
  end loop;
  insert into public.audit_log (action, target, detail) values ('org_import', 'organizations', jsonb_build_object('rows', n));
  return n;
end; $$;
grant execute on function public.org_import to authenticated;

-- ============ 4. Organisation representatives ============
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in (
  'citizen', 'moderator', 'admin', 'super_admin', 'state_admin', 'district_admin', 'content_manager', 'analyst', 'org_rep'));

create table if not exists public.org_reps (
  user_id uuid not null references auth.users on delete cascade,
  organization_id uuid not null references public.organizations on delete cascade,
  granted_by uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);
alter table public.org_reps enable row level security;
drop policy if exists "reps read" on public.org_reps;
create policy "reps read" on public.org_reps for select using (user_id = auth.uid() or public.is_admin());

create or replace function public.is_org_rep(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.org_reps r join public.profiles p on p.id = r.user_id
                 where r.user_id = auth.uid() and r.organization_id = p_org and p.active and p.role = 'org_rep');
$$;

-- Admins link or unlink a representative. Only verified, published organisations can have representatives.
create or replace function public.admin_set_org_rep(p_user uuid, p_org uuid, p_grant boolean default true)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  if p_grant then
    if not exists (select 1 from public.organizations where id = p_org and verified and status = 'published') then
      raise exception 'organisation must be verified and published first'; end if;
    insert into public.org_reps (user_id, organization_id) values (p_user, p_org) on conflict do nothing;
    update public.profiles set role = 'org_rep' where id = p_user and role = 'citizen';
  else
    delete from public.org_reps where user_id = p_user and organization_id = p_org;
    update public.profiles set role = 'citizen' where id = p_user and role = 'org_rep'
      and not exists (select 1 from public.org_reps where user_id = p_user);
  end if;
  insert into public.audit_log (action, target, detail) values (case when p_grant then 'org_rep_grant' else 'org_rep_revoke' end, p_user::text, jsonb_build_object('organization', p_org));
end; $$;
grant execute on function public.admin_set_org_rep to authenticated;

-- ============ 5. Verified organisation responses ============
create table if not exists public.org_responses (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  organization_id uuid not null references public.organizations on delete cascade,
  author_id uuid not null default auth.uid() references auth.users on delete cascade,
  body text not null check (char_length(body) between 10 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists org_responses_post_idx on public.org_responses (post_id, created_at);
alter table public.org_responses enable row level security;
-- Responses are visible wherever the feedback itself is visible.
drop policy if exists "org responses read" on public.org_responses;
create policy "org responses read" on public.org_responses for select using (exists (select 1 from public.posts p where p.id = post_id));

alter table public.post_events drop constraint if exists post_events_kind_check;
alter table public.post_events add constraint post_events_kind_check check (kind in (
  'created', 'status', 'publication', 'assignment', 'response', 'note', 'withdrawn', 'hidden', 'org_response', 'further_review'));

-- A representative may respond only to published, public feedback about their own verified organisation.
-- They can never edit or hide the feedback itself.
create or replace function public.org_respond(p_post uuid, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare p public.posts; rid uuid;
begin
  select * into p from public.posts where id = p_post;
  if p.id is null or p.organization_id is null or not public.is_org_rep(p.organization_id) then raise exception 'not authorised'; end if;
  if p.visibility <> 'public' or p.publication <> 'approved' or p.hidden or p.withdrawn then raise exception 'feedback is not published'; end if;
  insert into public.org_responses (post_id, organization_id, body) values (p_post, p.organization_id, p_body) returning id into rid;
  insert into public.post_events (post_id, kind, to_value) values (p_post, 'org_response', left(p_body, 300));
  return rid;
end; $$;
grant execute on function public.org_respond to authenticated;

-- ============ 6. Status changes, further review, withdrawal ============
create or replace function public.posts_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.ref_no := 'OYOI-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.feedback_ref_seq')::text, 6, '0');
  new.publication := 'pending';
  new.status := 'Submitted';
  new.assigned_to := null;
  new.withdrawn := false;
  new.further_reviews := 0;
  new.updated_at := now();
  new.status_changed_at := now();
  -- Users can only link an organisation that exists and is visible to them.
  if new.organization_id is not null and not exists (select 1 from public.organizations where id = new.organization_id) then new.organization_id := null; end if;
  return new;
end; $$;

create or replace function public.posts_status_time() returns trigger language plpgsql as $$
begin if new.status is distinct from old.status then new.status_changed_at := now(); end if; return new; end; $$;
drop trigger if exists posts_status_time on public.posts;
create trigger posts_status_time before update on public.posts for each row execute function public.posts_status_time();

drop policy if exists "posts insert own" on public.posts;
create policy "posts insert own" on public.posts for insert with check (
  author_id = auth.uid() and hidden = false and status = 'Submitted' and response is null and sample = false
  and not exists (select 1 from jsonb_array_elements(evidence) e where coalesce(e->>'status', 'pending') <> 'pending'));

-- Public read: sample rows never appear publicly.
drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select using (
  (visibility = 'public' and hidden = false and publication = 'approved' and withdrawn = false and sample = false)
  or author_id = auth.uid()
  or (public.is_mod() and public.in_my_scope(state, district))
  or public.my_role() = 'analyst'
);

create or replace function public.withdraw_feedback(p_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('oyoi.reason', coalesce(p_reason, ''), true);
  update public.posts set withdrawn = true where id = p_id and author_id = auth.uid() and status not in ('Outcome provided', 'Closed');
  if not found then raise exception 'cannot withdraw this feedback'; end if;
end; $$;

-- Platform policy: the author may ask for further review within 30 days of an outcome or closure, at most twice.
create or replace function public.request_further_review(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare p public.posts;
begin
  if char_length(coalesce(p_reason, '')) < 10 then raise exception 'please explain why (at least 10 characters)'; end if;
  select * into p from public.posts where id = p_id and author_id = auth.uid();
  if p.id is null then raise exception 'not found'; end if;
  if p.status not in ('Outcome provided', 'Closed') then raise exception 'further review is available after an outcome is provided'; end if;
  if p.status_changed_at < now() - interval '30 days' then raise exception 'the 30 day window for further review has passed'; end if;
  if p.further_reviews >= 2 then raise exception 'further review has already been requested twice'; end if;
  perform set_config('oyoi.reason', 'Further review requested: ' || left(p_reason, 900), true);
  update public.posts set status = 'Under review', further_reviews = further_reviews + 1 where id = p_id;
  insert into public.post_events (post_id, kind, from_value, to_value, reason) values (p_id, 'further_review', p.status, 'Under review', left(p_reason, 1000));
end; $$;
grant execute on function public.request_further_review to authenticated;

create or replace function public.notify_author() returns trigger
language plpgsql security definer set search_path = public as $$
declare p public.posts; o text;
begin
  select * into p from public.posts where id = new.post_id;
  if p.author_id is null or p.author_id = new.actor then return new; end if;
  if new.kind = 'status' then
    insert into public.notifications (user_id, post_id, title, body) values (p.author_id, p.id, p.ref_no || ': progress is now ' || new.to_value, coalesce(new.reason, p.title));
  elsif new.kind = 'publication' and new.to_value in ('approved', 'rejected') then
    insert into public.notifications (user_id, post_id, title, body) values (p.author_id, p.id,
      p.ref_no || case when new.to_value = 'approved' then ': published on the site' else ': not published' end, coalesce(new.reason, p.title));
  elsif new.kind = 'response' and new.to_value is not null and new.to_value <> '' then
    insert into public.notifications (user_id, post_id, title, body) values (p.author_id, p.id, p.ref_no || ': response from One Youth One India', left(new.to_value, 300));
  elsif new.kind = 'org_response' then
    select name into o from public.organizations where id = p.organization_id;
    insert into public.notifications (user_id, post_id, title, body) values (p.author_id, p.id, p.ref_no || ': ' || coalesce(o, 'the organisation') || ' responded', left(new.to_value, 300));
  end if;
  return new;
end; $$;

-- ============ 7. Helpful votes ============
alter table public.votes drop constraint if exists votes_kind_check;
alter table public.votes add constraint votes_kind_check check (kind in ('metoo', 'flag', 'helpful'));

-- ============ 8. Organisation stats for public profiles (aggregates only) ============
create or replace function public.org_stats(p_org uuid)
returns table (reviews bigint, avg_rating numeric, responses bigint, outcomes bigint)
language sql stable security definer set search_path = public as $$
  select count(*) filter (where p.rating is not null), round(avg(p.rating)::numeric, 1),
         (select count(*) from public.org_responses r where r.organization_id = p_org),
         count(*) filter (where p.status in ('Outcome provided', 'Closed'))
  from public.posts p
  where p.organization_id = p_org and p.visibility = 'public' and p.publication = 'approved' and not p.hidden and not p.withdrawn and not p.sample;
$$;
grant execute on function public.org_stats to anon, authenticated;

-- Realtime for live dashboards.
do $$ begin
  begin alter publication supabase_realtime add table public.org_responses; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.posts; exception when duplicate_object then null; end;
end $$;
