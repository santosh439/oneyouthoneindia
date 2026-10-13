-- One Youth One India: migration 002
-- User dashboard, admin portal, scoped roles, feedback IDs, moderation gate,
-- append only status history and audit trail, notifications.
-- Run ONCE in Supabase: SQL Editor > New query > paste > Run. Safe to re-run.

-- ============ 1. Roles and jurisdiction ============
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in (
  'citizen', 'moderator', 'admin', 'super_admin', 'state_admin', 'district_admin', 'content_manager', 'analyst'));
alter table public.profiles add column if not exists scope_state text;
alter table public.profiles add column if not exists scope_district text;
alter table public.profiles add column if not exists active boolean not null default true;

-- Current user's role (security definer so policies can call it without recursion).
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid() and active), 'citizen');
$$;

-- Platform wide administrators.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_role() in ('admin', 'super_admin');
$$;

-- Anyone who works the feedback queue (used by the existing moderation sheet too).
create or replace function public.is_mod() returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_role() in ('moderator', 'admin', 'super_admin', 'state_admin', 'district_admin');
$$;

-- Read only analytics access.
create or replace function public.can_view_analytics() returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_role() in ('moderator', 'admin', 'super_admin', 'state_admin', 'district_admin', 'analyst');
$$;

-- Can the current user manage a post in this state / district?
create or replace function public.in_my_scope(p_state text, p_district text) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.my_role()
    when 'super_admin' then true
    when 'admin' then true
    when 'moderator' then true
    when 'state_admin' then exists (select 1 from public.profiles where id = auth.uid() and lower(scope_state) = lower(p_state))
    when 'district_admin' then exists (select 1 from public.profiles where id = auth.uid() and lower(scope_state) = lower(p_state) and lower(scope_district) = lower(coalesce(p_district, '')))
    else false end;
$$;

-- ============ 2. Feedback fields ============
create sequence if not exists public.feedback_ref_seq start 1001;
alter table public.posts add column if not exists ref_no text unique;
alter table public.posts add column if not exists publication text not null default 'pending';
alter table public.posts add column if not exists assigned_to uuid references auth.users on delete set null;
alter table public.posts add column if not exists withdrawn boolean not null default false;
alter table public.posts add column if not exists updated_at timestamptz not null default now();

alter table public.posts drop constraint if exists posts_publication_check;
alter table public.posts add constraint posts_publication_check check (publication in ('pending', 'approved', 'rejected'));

-- Workflow: Open (Submitted) > Acknowledged (Under review) > Assigned > In progress > Resolved / Rejected > Closed
alter table public.posts drop constraint if exists posts_status_check;
-- Also accepts the newer Feedback Progress names (migration 007), so re-running this file later is safe.
alter table public.posts add constraint posts_status_check check (status in (
  'Open', 'Acknowledged', 'Assigned', 'In progress', 'Resolved', 'Rejected', 'Closed',
  'Submitted', 'Under review', 'Response awaited', 'Action in progress', 'Outcome provided'));

-- Everything already on the site stays public; new submissions wait for moderation.
update public.posts set publication = 'approved' where publication = 'pending' and created_at < now() and ref_no is null;
update public.posts set ref_no = 'OYOI-' || to_char(created_at, 'YYYY') || '-' || lpad(nextval('public.feedback_ref_seq')::text, 6, '0') where ref_no is null;

create index if not exists posts_author_idx on public.posts (author_id, created_at desc);
create index if not exists posts_status_idx on public.posts (status);
create index if not exists posts_publication_idx on public.posts (publication);
create index if not exists posts_assigned_idx on public.posts (assigned_to);

-- Assign a Feedback ID and force safe defaults on every new submission.
create or replace function public.posts_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.ref_no := 'OYOI-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.feedback_ref_seq')::text, 6, '0');
  new.publication := 'pending';
  new.status := 'Submitted';  -- Feedback Progress name (migration 007); the status constraint above accepts it
  new.assigned_to := null;
  new.withdrawn := false;
  new.updated_at := now();
  return new;
end; $$;
drop trigger if exists posts_before_insert on public.posts;
create trigger posts_before_insert before insert on public.posts for each row execute function public.posts_before_insert();
-- New submissions start as 'Submitted' (accepted before and after migration 007).
drop policy if exists "posts insert own" on public.posts;
create policy "posts insert own" on public.posts for insert with check (
  author_id = auth.uid() and hidden = false and status in ('Open', 'Submitted') and response is null and sample = false
  and not exists (select 1 from jsonb_array_elements(evidence) e where coalesce(e->>'status', 'pending') <> 'pending'));

-- ============ 3. History, internal notes and audit (append only) ============
create table if not exists public.post_events (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.posts on delete cascade,
  actor uuid default auth.uid() references auth.users on delete set null,
  kind text not null check (kind in ('created', 'status', 'publication', 'assignment', 'response', 'note', 'withdrawn', 'hidden')),
  from_value text,
  to_value text,
  reason text check (char_length(reason) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists post_events_post_idx on public.post_events (post_id, created_at);
alter table public.post_events enable row level security;

-- Author sees the public timeline of their own feedback (never internal notes); staff see events in scope.
drop policy if exists "events read" on public.post_events;
create policy "events read" on public.post_events for select using (
  (kind <> 'note' and exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()))
  or exists (select 1 from public.posts p where p.id = post_id and public.is_mod() and public.in_my_scope(p.state, p.district))
  or (public.my_role() = 'analyst' and kind <> 'note')
);
-- Staff may add internal notes in scope. No update or delete policy: the trail is append only.
drop policy if exists "events add note" on public.post_events;
create policy "events add note" on public.post_events for insert with check (
  kind = 'note' and actor = auth.uid()
  and exists (select 1 from public.posts p where p.id = post_id and public.is_mod() and public.in_my_scope(p.state, p.district))
);

-- Record every significant change automatically, with the actor and optional reason.
create or replace function public.posts_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := nullif(current_setting('oyoi.reason', true), '');
begin
  if tg_op = 'INSERT' then
    insert into public.post_events (post_id, actor, kind, to_value) values (new.id, auth.uid(), 'created', new.status);
    return new;
  end if;
  new.updated_at := now();
  if new.status is distinct from old.status then
    insert into public.post_events (post_id, actor, kind, from_value, to_value, reason) values (new.id, auth.uid(), 'status', old.status, new.status, r);
  end if;
  if new.publication is distinct from old.publication then
    insert into public.post_events (post_id, actor, kind, from_value, to_value, reason) values (new.id, auth.uid(), 'publication', old.publication, new.publication, r);
  end if;
  if new.assigned_to is distinct from old.assigned_to then
    insert into public.post_events (post_id, actor, kind, from_value, to_value, reason) values (new.id, auth.uid(), 'assignment', old.assigned_to::text, new.assigned_to::text, r);
  end if;
  if new.response is distinct from old.response then
    insert into public.post_events (post_id, actor, kind, to_value) values (new.id, auth.uid(), 'response', new.response);
  end if;
  if new.withdrawn and not old.withdrawn then
    insert into public.post_events (post_id, actor, kind, reason) values (new.id, auth.uid(), 'withdrawn', r);
  end if;
  if new.hidden is distinct from old.hidden then
    insert into public.post_events (post_id, actor, kind, from_value, to_value, reason) values (new.id, auth.uid(), 'hidden', old.hidden::text, new.hidden::text, r);
  end if;
  return new;
end; $$;
drop trigger if exists posts_audit_ins on public.posts;
create trigger posts_audit_ins after insert on public.posts for each row execute function public.posts_audit();
drop trigger if exists posts_audit_upd on public.posts;
create trigger posts_audit_upd before update on public.posts for each row execute function public.posts_audit();

-- ============ 4. Notifications ============
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  post_id uuid references public.posts on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists "notifications read own" on public.notifications;
create policy "notifications read own" on public.notifications for select using (user_id = auth.uid());
drop policy if exists "notifications mark read" on public.notifications;
create policy "notifications mark read" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.notify_author() returns trigger
language plpgsql security definer set search_path = public as $$
declare p public.posts;
begin
  select * into p from public.posts where id = new.post_id;
  if p.author_id is null or p.author_id = new.actor then return new; end if;
  if new.kind = 'status' then
    insert into public.notifications (user_id, post_id, title, body) values (p.author_id, p.id, p.ref_no || ': status is now ' || new.to_value, coalesce(new.reason, p.title));
  elsif new.kind = 'publication' and new.to_value in ('approved', 'rejected') then
    insert into public.notifications (user_id, post_id, title, body) values (p.author_id, p.id,
      p.ref_no || case when new.to_value = 'approved' then ': published on the site' else ': not published' end, coalesce(new.reason, p.title));
  elsif new.kind = 'response' and new.to_value is not null and new.to_value <> '' then
    insert into public.notifications (user_id, post_id, title, body) values (p.author_id, p.id, p.ref_no || ': official response added', left(new.to_value, 300));
  end if;
  return new;
end; $$;
drop trigger if exists notify_author on public.post_events;
create trigger notify_author after insert on public.post_events for each row execute function public.notify_author();

-- ============ 5. Row level security for posts ============
drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select using (
  (visibility = 'public' and hidden = false and publication = 'approved' and withdrawn = false)
  or author_id = auth.uid()
  or (public.is_mod() and public.in_my_scope(state, district))
  or public.my_role() = 'analyst'
);
drop policy if exists "posts moderate" on public.posts;
create policy "posts moderate" on public.posts for update
  using (public.is_mod() and public.in_my_scope(state, district))
  with check (public.is_mod() and public.in_my_scope(state, district));
drop policy if exists "posts delete own or mod" on public.posts;
drop policy if exists "posts delete admin" on public.posts;
create policy "posts delete admin" on public.posts for delete using (public.is_admin());

-- ============ 6. Staff actions (RPC), each carrying an optional reason ============
create or replace function public.staff_update(p_id uuid, p_status text default null, p_publication text default null,
  p_assigned uuid default null, p_unassign boolean default false, p_response text default null, p_hidden boolean default null, p_reason text default null)
returns void language plpgsql security invoker set search_path = public as $$
begin
  if not public.is_mod() then raise exception 'not authorised'; end if;
  perform set_config('oyoi.reason', coalesce(p_reason, ''), true);
  update public.posts set
    status = coalesce(p_status, status),
    publication = coalesce(p_publication, publication),
    assigned_to = case when p_unassign then null else coalesce(p_assigned, assigned_to) end,
    response = coalesce(p_response, response),
    response_at = case when p_response is not null then now() else response_at end,
    hidden = coalesce(p_hidden, hidden)
  where id = p_id;
  if not found then raise exception 'not found or outside your scope'; end if;
end; $$;
grant execute on function public.staff_update to authenticated;

-- Author withdraws their own feedback (kept for the record, removed from public view).
create or replace function public.withdraw_feedback(p_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('oyoi.reason', coalesce(p_reason, ''), true);
  update public.posts set withdrawn = true where id = p_id and author_id = auth.uid() and status not in ('Resolved', 'Closed', 'Outcome provided');
  if not found then raise exception 'cannot withdraw this feedback'; end if;
end; $$;
grant execute on function public.withdraw_feedback to authenticated;

-- ============ 7. User and role management (admins only) ============
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid default auth.uid() references auth.users on delete set null,
  action text not null,
  target text,
  detail jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
drop policy if exists "audit read admin" on public.audit_log;
create policy "audit read admin" on public.audit_log for select using (public.is_admin());
-- No insert, update or delete policies: rows are written only by security definer functions.

create or replace function public.admin_list_users()
returns table (id uuid, email text, phone text, display_name text, role text, scope_state text, scope_district text, active boolean, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  return query select u.id, u.email::text, u.phone::text, p.display_name, p.role, p.scope_state, p.scope_district, p.active, u.created_at, u.last_sign_in_at
    from auth.users u left join public.profiles p on p.id = u.id order by u.created_at desc;
end; $$;
grant execute on function public.admin_list_users to authenticated;

create or replace function public.admin_set_role(p_user uuid, p_role text, p_state text default null, p_district text default null, p_active boolean default true)
returns void language plpgsql security definer set search_path = public as $$
declare old_role text;
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  if p_role = 'super_admin' and public.my_role() <> 'super_admin' then raise exception 'only a super admin can grant super admin'; end if;
  if p_user = auth.uid() and p_role not in ('admin', 'super_admin') then raise exception 'you cannot remove your own admin role'; end if;
  select role into old_role from public.profiles where id = p_user;
  insert into public.profiles (id, role, scope_state, scope_district, active) values (p_user, p_role, p_state, p_district, p_active)
    on conflict (id) do update set role = excluded.role, scope_state = excluded.scope_state, scope_district = excluded.scope_district, active = excluded.active;
  insert into public.audit_log (action, target, detail) values ('role_change', p_user::text,
    jsonb_build_object('from', old_role, 'to', p_role, 'state', p_state, 'district', p_district, 'active', p_active));
end; $$;
grant execute on function public.admin_set_role to authenticated;

-- Staff names for assignment dropdowns (no emails exposed).
create or replace function public.staff_directory()
returns table (id uuid, display_name text, role text, scope_state text, scope_district text)
language sql stable security definer set search_path = public as $$
  select id, display_name, role, scope_state, scope_district from public.profiles
  where public.is_mod() and active and role in ('moderator', 'admin', 'super_admin', 'state_admin', 'district_admin');
$$;
grant execute on function public.staff_directory to authenticated;

-- ============ 8. Realtime ============
do $$ begin
  begin alter publication supabase_realtime add table public.post_events; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end;
end $$;

-- ============ 9. First super admin ============
-- After signing in once on the site, run (replace the email):
-- update public.profiles set role = 'super_admin' where id = (select id from auth.users where email = 'you@example.com');
