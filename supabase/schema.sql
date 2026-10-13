-- One Youth One India: Supabase schema with row level security.
-- Run once in Supabase: SQL Editor > New query > paste > Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  role text not null default 'citizen' check (role in ('citizen', 'moderator', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users on delete cascade,
  type text not null check (type in ('issue', 'review')),
  cat text not null,
  sub text,
  entity text not null check (char_length(entity) between 2 and 160),
  city text not null,
  tehsil text,
  district text,
  state text not null,
  rating int check (rating between 1 and 5),
  severity text check (severity in ('Low', 'Medium', 'High', 'Critical')),
  title text not null check (char_length(title) between 6 and 90),
  body text not null check (char_length(body) between 20 and 1200),
  anon boolean not null default false,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  status text not null default 'Open' check (status in ('Open', 'Acknowledged', 'In progress', 'Resolved')),
  hidden boolean not null default false,
  response text,
  response_at timestamptz,
  sample boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_place_idx on public.posts (state, district);

create table if not exists public.votes (
  post_id uuid not null references public.posts on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null check (kind in ('metoo', 'flag')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);

-- Aggregated counts without exposing who voted.
create or replace view public.vote_counts as
  select post_id, kind, count(*)::int as n from public.votes group by post_id, kind;

create or replace function public.is_mod() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'));
$$;

-- Create a profile automatically for every new user.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.votes enable row level security;

-- Profiles: everyone sees display names; people edit only their own name, never their role.
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert with check (id = auth.uid() and role = 'citizen');
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- Posts: public and visible to all; private only to the author; moderators see everything.
drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select using ((visibility = 'public' and hidden = false) or author_id = auth.uid() or public.is_mod());
drop policy if exists "posts insert own" on public.posts;
create policy "posts insert own" on public.posts for insert with check (author_id = auth.uid() and hidden = false and status in ('Open', 'Submitted') and response is null and sample = false);
drop policy if exists "posts moderate" on public.posts;
create policy "posts moderate" on public.posts for update using (public.is_mod()) with check (public.is_mod());
drop policy if exists "posts delete own or mod" on public.posts;
create policy "posts delete own or mod" on public.posts for delete using (author_id = auth.uid() or public.is_mod());

-- Votes: each person manages only their own votes.
drop policy if exists "votes read own" on public.votes;
create policy "votes read own" on public.votes for select using (user_id = auth.uid());
drop policy if exists "votes insert own" on public.votes;
create policy "votes insert own" on public.votes for insert with check (user_id = auth.uid());
drop policy if exists "votes delete own" on public.votes;
create policy "votes delete own" on public.votes for delete using (user_id = auth.uid());

grant select on public.vote_counts to anon, authenticated;

-- Realtime updates for the live feed.
do $$ begin
  begin alter publication supabase_realtime add table public.posts; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.votes; exception when duplicate_object then null; end;
end $$;

-- Make yourself an admin after your first sign in (replace the phone number):
-- update public.profiles set role = 'admin' where id = (select id from auth.users where phone = '91XXXXXXXXXX');

-- ============ Evidence uploads (photos and videos) ============
alter table public.posts add column if not exists evidence jsonb not null default '[]'::jsonb;
-- New posts cannot self approve their evidence.
drop policy if exists "posts insert own" on public.posts;
create policy "posts insert own" on public.posts for insert with check (
  author_id = auth.uid() and hidden = false and status in ('Open', 'Submitted') and response is null and sample = false
  and not exists (select 1 from jsonb_array_elements(evidence) e where coalesce(e->>'status', 'pending') <> 'pending')
);

-- Private storage bucket, 20 MB per file, photos and videos only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

-- Upload only into your own folder: evidence/<your user id>/...
drop policy if exists "evidence upload own" on storage.objects;
create policy "evidence upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);

-- Read: the uploader, moderators, or anyone once a moderator approved it for public view on a visible post.
drop policy if exists "evidence read" on storage.objects;
create policy "evidence read" on storage.objects for select using (
  bucket_id = 'evidence' and (
    owner = auth.uid() or public.is_mod() or exists (
      select 1 from public.posts p, jsonb_array_elements(p.evidence) e
      where e->>'ref' = storage.objects.name and e->>'status' = 'approved' and coalesce(e->>'audience', 'public') = 'public'
        and p.hidden = false and p.visibility = 'public'
    )
  )
);
drop policy if exists "evidence delete own or mod" on storage.objects;
create policy "evidence delete own or mod" on storage.objects for delete using (bucket_id = 'evidence' and (owner = auth.uid() or public.is_mod()));

-- Language of the post when typed or spoken in an Indian language (BCP 47 code such as hi-IN).
alter table public.posts add column if not exists lang text;

-- ============ Private profile details (never shown publicly) ============
create table if not exists public.profile_details (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  gender text not null check (gender in ('Female', 'Male', 'Non-binary', 'Other', 'Prefer not to say')),
  age int not null check (age between 18 and 120),
  updated_at timestamptz not null default now()
);
alter table public.profile_details enable row level security;
drop policy if exists "details read own" on public.profile_details;
create policy "details read own" on public.profile_details for select using (id = auth.uid());
drop policy if exists "details insert own" on public.profile_details;
create policy "details insert own" on public.profile_details for insert with check (id = auth.uid());
drop policy if exists "details update own" on public.profile_details;
create policy "details update own" on public.profile_details for update using (id = auth.uid()) with check (id = auth.uid());

-- Sign in providers to enable in Supabase > Authentication > Providers:
--   Google (Gmail), Facebook, LinkedIn (OIDC), Email (one time code: works for Yahoo, Rediffmail, Outlook and any email), Phone (SMS OTP).
-- Add https://www.oneyouthoneindia.com to Authentication > URL Configuration > Redirect URLs.
