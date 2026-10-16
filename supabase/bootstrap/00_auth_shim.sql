-- ============================================================================
-- Self-hosted auth schema bootstrap
-- ----------------------------------------------------------------------------
-- Recreates the minimal subset of the Supabase-managed `auth` schema that this
-- repository actually depends on, so `supabase/migrations/*.sql` and the RLS
-- policies can run against a plain PostgreSQL instance fronted by PostgREST.
-- See docs/adr/0002-postgres-postgrest-custom-auth.md.
--
-- MUST be applied before supabase/migrations/*.sql.
--
-- What this provides:
--   * roles `anon`, `authenticated`, `service_role` and the `authenticator`
--     login role PostgREST switches from, based on the JWT `role` claim
--   * `auth.users`      - referenced by FKs and by the on_auth_user_* triggers
--   * `auth.identities` - email/OAuth identity links
--   * `auth.refresh_tokens`, `auth.magic_links` - custom auth service storage
--   * `auth.uid()`, `auth.role()`, `auth.jwt()` - claim helpers used by RLS
--
-- The `auth` schema is deliberately NOT exposed to PostgREST (`db-schemas`
-- stays `public`), because `auth.users` holds password hashes. The API reaches
-- it with a direct SQL connection instead.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Roles
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon noinherit nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated noinherit nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    -- service_role bypasses RLS, matching the managed Supabase behaviour the
    -- API's admin client relies on.
    create role service_role noinherit nologin bypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator noinherit login;
  end if;
end
$$;

-- PostgREST connects as `authenticator` and SET ROLEs into the JWT's role.
grant anon, authenticated, service_role to authenticator;

-- ---------------------------------------------------------------------------
-- 2. Schema privileges
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

-- Managed Supabase grants blanket table privileges and lets RLS do the actual
-- gating; the migrations assume that. Recreate it for current and future objects.
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. auth schema
-- ---------------------------------------------------------------------------
create schema if not exists auth;

-- Mirrors the columns the application and the seed fixtures depend on. The
-- GoTrue-only columns (`instance_id`, `aud`, `role`, `raw_app_meta_data`,
-- `is_sso_user`, `is_anonymous`) are kept so existing seed data and tooling that
-- references them keep working unchanged.
create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  instance_id        uuid,
  aud                text default 'authenticated',
  role               text default 'authenticated',
  email              text unique not null,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data  jsonb not null default '{}'::jsonb,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  last_sign_in_at    timestamptz,
  banned_until       timestamptz,
  is_sso_user        boolean not null default false,
  is_anonymous       boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists auth_users_email_idx on auth.users (lower(email));

create table if not exists auth.identities (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  provider      text not null,
  provider_id   text not null,
  identity_data jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (provider, provider_id)
);

create index if not exists auth_identities_user_idx on auth.identities (user_id);

-- Opaque refresh tokens are stored hashed; `rotated_from` + `revoked` implement
-- rotation with reuse detection.
create table if not exists auth.refresh_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  token_hash   text not null unique,
  rotated_from uuid references auth.refresh_tokens(id) on delete set null,
  revoked      boolean not null default false,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists auth_refresh_tokens_user_idx on auth.refresh_tokens (user_id);
create index if not exists auth_refresh_tokens_expires_idx on auth.refresh_tokens (expires_at);

-- Single-use, short-lived email links (magic link / email verification).
create table if not exists auth.magic_links (
  token_hash  text primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  email       text not null,
  purpose     text not null default 'magiclink',
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists auth_magic_links_email_idx on auth.magic_links (lower(email));

-- ---------------------------------------------------------------------------
-- 4. Claim helpers
-- ---------------------------------------------------------------------------
-- PostgREST exposes the verified JWT to the database as `request.jwt.claims`
-- (JSON). Older versions also set individual `request.jwt.claim.<name>`
-- settings. Both are checked so the helpers work either way.

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claim.sub', true),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    ),
    ''
  )::uuid
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claim.role', true),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    ),
    ''
  )
$$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.role(), auth.jwt()
  to anon, authenticated, service_role;

-- The `authenticator` role must be able to read what it switches into.
grant usage on schema auth to authenticator;

-- ---------------------------------------------------------------------------
-- 5. Keep updated_at honest
-- ---------------------------------------------------------------------------
create or replace function auth.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists auth_users_touch_updated_at on auth.users;
create trigger auth_users_touch_updated_at
  before update on auth.users
  for each row execute function auth.touch_updated_at();

drop trigger if exists auth_identities_touch_updated_at on auth.identities;
create trigger auth_identities_touch_updated_at
  before update on auth.identities
  for each row execute function auth.touch_updated_at();

-- Force PostgREST to pick up the new roles/schema. Safe to run when it is not
-- running. See supabase/bootstrap/10_auth_api.sql for the same statement.
notify pgrst, 'reload schema';
