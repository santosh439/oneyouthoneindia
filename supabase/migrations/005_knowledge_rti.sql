-- One Youth One India: migration 005
-- RTI workspace (each person's own RTI applications and deadlines) and knowledge base review.
-- Run ONCE in Supabase SQL Editor (after 002 to 004). Safe to re-run.

-- ============ 1. RTI workspace ============
create table if not exists public.rti_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null check (char_length(title) between 3 and 200),
  authority text check (char_length(authority) <= 200),
  level text not null default 'central' check (level in ('central', 'state')),
  state text check (char_length(state) <= 60),
  reg_no text check (char_length(reg_no) <= 80),
  filed_on date,
  via_apio boolean not null default false,
  life_liberty boolean not null default false,
  third_party boolean not null default false,
  reply_on date,
  fa_filed_on date,
  fa_order_on date,
  sa_filed_on date,
  status text not null default 'open' check (status in ('draft', 'open', 'closed')),
  draft text check (char_length(draft) <= 20000),
  notes text check (char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reply_on is null or filed_on is null or reply_on >= filed_on),
  check (fa_filed_on is null or filed_on is null or fa_filed_on >= filed_on),
  check (fa_order_on is null or fa_filed_on is null or fa_order_on >= fa_filed_on),
  check (sa_filed_on is null or fa_filed_on is null or sa_filed_on >= fa_filed_on)
);
create index if not exists rti_requests_user_idx on public.rti_requests (user_id, created_at desc);
create or replace function public.rti_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); new.user_id := old.user_id; return new; end; $$;
drop trigger if exists rti_touch on public.rti_requests;
create trigger rti_touch before update on public.rti_requests for each row execute function public.rti_touch();

alter table public.rti_requests enable row level security;
-- Private: only the owner can see or change their RTI records. Staff have no access.
drop policy if exists "rti own" on public.rti_requests;
create policy "rti own" on public.rti_requests for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ 2. Knowledge base review in the CMS ============
-- Adds the 'knowledge' collection: Constitution, RTI and government entries imported by
-- Website Data Sync as drafts, reviewed against official sources and then published.
alter table public.cms_items drop constraint if exists cms_items_collection_check;
alter table public.cms_items add constraint cms_items_collection_check check (collection in ('helplines', 'channels', 'categories', 'legal', 'site', 'knowledge'));
