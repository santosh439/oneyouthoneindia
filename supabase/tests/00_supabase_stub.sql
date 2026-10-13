-- Minimal stand-ins for Supabase auth, storage and realtime so migrations run on plain PostgreSQL in CI. Test only.
-- Minimal Supabase stand-ins
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, phone text, created_at timestamptz default now(), last_sign_in_at timestamptz);
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text, owner uuid);
create or replace function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
alter table storage.objects enable row level security;
create publication supabase_realtime;
grant usage on schema public, auth to authenticated, anon;
