-- One Youth One India: migration 003
-- Website content management (CMS) and Website Data Sync.
-- Requires migration 002. Run ONCE in Supabase SQL Editor. Safe to re-run.

-- Who may edit website content.
create or replace function public.can_edit_content() returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_role() in ('content_manager', 'admin', 'super_admin');
$$;

-- ============ 1. Content items ============
-- One row per manageable item, e.g. collection 'helplines' key '112'.
create table if not exists public.cms_items (
  id uuid primary key default gen_random_uuid(),
  collection text not null check (collection in ('helplines', 'channels', 'categories', 'legal', 'site')),
  key text not null check (char_length(key) between 1 and 80),
  data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  publish_at timestamptz,                 -- optional scheduled publication
  version int not null default 1,
  source text,                            -- where the record was imported from
  source_hash text,                       -- fingerprint of the source data last accepted
  staged_data jsonb,                      -- a newer source version waiting for review
  staged_hash text,
  staged_at timestamptz,
  updated_by uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection, key)
);
create index if not exists cms_items_live_idx on public.cms_items (status, collection);
alter table public.cms_items enable row level security;

-- Public: only published items whose scheduled time has arrived. Content staff: everything.
drop policy if exists "cms read" on public.cms_items;
create policy "cms read" on public.cms_items for select using (
  (status = 'published' and (publish_at is null or publish_at <= now())) or public.can_edit_content()
);
drop policy if exists "cms write" on public.cms_items;
create policy "cms write" on public.cms_items for all using (public.can_edit_content()) with check (public.can_edit_content());
grant select on public.cms_items to anon, authenticated;

-- ============ 2. Revision history (append only) ============
create table if not exists public.cms_revisions (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.cms_items on delete cascade,
  version int not null,
  data jsonb not null,
  status text not null,
  publish_at timestamptz,
  actor uuid default auth.uid() references auth.users on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists cms_revisions_item_idx on public.cms_revisions (item_id, version desc);
alter table public.cms_revisions enable row level security;
drop policy if exists "cms revisions read" on public.cms_revisions;
create policy "cms revisions read" on public.cms_revisions for select using (public.can_edit_content());
-- No insert, update or delete policies: written only by the trigger below.

create or replace function public.cms_track() returns trigger
language plpgsql security definer set search_path = public as $$
declare n text := nullif(current_setting('oyoi.cms_note', true), '');
begin
  if tg_op = 'UPDATE' then
    if new.data is not distinct from old.data and new.status is not distinct from old.status and new.publish_at is not distinct from old.publish_at then
      new.updated_at := now();
      return new;   -- only staging fields changed: no new version
    end if;
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  insert into public.cms_revisions (item_id, version, data, status, publish_at, note)
    values (new.id, new.version, new.data, new.status, new.publish_at, coalesce(n, case when tg_op = 'INSERT' then 'Created' end));
  return new;
end; $$;
drop trigger if exists cms_track_ins on public.cms_items;
-- AFTER INSERT so the revision can reference the new row; BEFORE UPDATE so the version number is set on the row itself.
create or replace function public.cms_track_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.cms_revisions (item_id, version, data, status, publish_at, note)
    values (new.id, new.version, new.data, new.status, new.publish_at, coalesce(nullif(current_setting('oyoi.cms_note', true), ''), 'Created'));
  return new;
end; $$;
create trigger cms_track_ins after insert on public.cms_items for each row execute function public.cms_track_insert();
drop trigger if exists cms_track_upd on public.cms_items;
create trigger cms_track_upd before update on public.cms_items for each row execute function public.cms_track();

-- ============ 3. Sync runs ============
create table if not exists public.sync_runs (
  id bigint generated always as identity primary key,
  source text not null,
  mode text not null default 'manual' check (mode in ('manual', 'auto')),
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  total int not null default 0,
  imported int not null default 0,
  changed int not null default 0,
  unchanged int not null default 0,
  failed int not null default 0,
  errors jsonb not null default '[]'::jsonb,
  build text,
  actor uuid default auth.uid() references auth.users on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
alter table public.sync_runs enable row level security;
drop policy if exists "sync runs read" on public.sync_runs;
create policy "sync runs read" on public.sync_runs for select using (public.can_edit_content());

-- Import a batch from one source. New keys become drafts; changed source data is
-- staged for review (never overwrites what an editor has written); identical data is skipped.
create or replace function public.cms_import(p_source text, p_rows jsonb, p_mode text default 'manual', p_build text default null)
returns public.sync_runs language plpgsql security definer set search_path = public as $$
declare
  run public.sync_runs;
  r jsonb; h text; cur public.cms_items;
  v_imported int := 0; v_changed int := 0; v_unchanged int := 0; v_failed int := 0; v_errors jsonb := '[]'::jsonb;
begin
  if not public.can_edit_content() then raise exception 'not authorised'; end if;
  insert into public.sync_runs (source, mode, total, build) values (p_source, coalesce(p_mode, 'manual'), jsonb_array_length(p_rows), p_build) returning * into run;
  perform set_config('oyoi.cms_note', 'Imported from ' || p_source, true);
  for r in select * from jsonb_array_elements(p_rows) loop
    begin
      if coalesce(r->>'collection', '') = '' or coalesce(r->>'key', '') = '' or jsonb_typeof(r->'data') <> 'object' then
        raise exception 'collection, key and data object are required';
      end if;
      h := md5((r->'data')::text);
      select * into cur from public.cms_items where collection = r->>'collection' and key = r->>'key';
      if not found then
        insert into public.cms_items (collection, key, data, source, source_hash) values (r->>'collection', r->>'key', r->'data', p_source, h);
        v_imported := v_imported + 1;
      elsif cur.source_hash = h or cur.staged_hash = h then
        v_unchanged := v_unchanged + 1;
      else
        update public.cms_items set staged_data = r->'data', staged_hash = h, staged_at = now(), source = p_source where id = cur.id;
        v_changed := v_changed + 1;
      end if;
    exception when others then
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object('key', coalesce(r->>'collection', '?') || '/' || coalesce(r->>'key', '?'), 'error', sqlerrm);
    end;
  end loop;
  update public.sync_runs set imported = v_imported, changed = v_changed, unchanged = v_unchanged, failed = v_failed, errors = v_errors,
    status = case when v_failed = 0 then 'success' when v_failed < jsonb_array_length(p_rows) then 'partial' else 'failed' end, finished_at = now()
    where id = run.id returning * into run;
  return run;
end; $$;
grant execute on function public.cms_import to authenticated;

-- Accept or dismiss a staged source update.
create or replace function public.cms_accept_staged(p_id uuid, p_accept boolean default true)
returns void language plpgsql security invoker set search_path = public as $$
begin
  if not public.can_edit_content() then raise exception 'not authorised'; end if;
  perform set_config('oyoi.cms_note', case when p_accept then 'Accepted source update' else 'Dismissed source update' end, true);
  if p_accept then
    update public.cms_items set data = staged_data, source_hash = staged_hash, staged_data = null, staged_hash = null, staged_at = null where id = p_id and staged_data is not null;
  else
    update public.cms_items set source_hash = staged_hash, staged_data = null, staged_hash = null, staged_at = null where id = p_id;
  end if;
end; $$;
grant execute on function public.cms_accept_staged to authenticated;

-- Save, publish, schedule or archive an item with an optional note for the history.
create or replace function public.cms_save(p_id uuid, p_data jsonb default null, p_status text default null, p_publish_at timestamptz default null, p_clear_schedule boolean default false, p_note text default null)
returns void language plpgsql security invoker set search_path = public as $$
begin
  if not public.can_edit_content() then raise exception 'not authorised'; end if;
  perform set_config('oyoi.cms_note', coalesce(p_note, ''), true);
  update public.cms_items set
    data = coalesce(p_data, data),
    status = coalesce(p_status, status),
    publish_at = case when p_clear_schedule then null else coalesce(p_publish_at, publish_at) end
  where id = p_id;
  if not found then raise exception 'item not found'; end if;
end; $$;
grant execute on function public.cms_save to authenticated;

-- Roll back to an earlier version (creates a new version; history is never rewritten).
create or replace function public.cms_rollback(p_id uuid, p_version int)
returns void language plpgsql security invoker set search_path = public as $$
declare rev public.cms_revisions;
begin
  if not public.can_edit_content() then raise exception 'not authorised'; end if;
  select * into rev from public.cms_revisions where item_id = p_id and version = p_version;
  if not found then raise exception 'version not found'; end if;
  perform set_config('oyoi.cms_note', 'Rolled back to version ' || p_version, true);
  update public.cms_items set data = rev.data where id = p_id;
end; $$;
grant execute on function public.cms_rollback to authenticated;

-- Content managers can open the admin portal for content only.
-- (Feedback queue access stays with feedback roles from migration 002.)
