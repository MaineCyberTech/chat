-- ============================================================================
-- Self-hosted auth API
-- ----------------------------------------------------------------------------
-- Server-side primitives for the custom auth service that replaces GoTrue.
-- Part of docs/adr/0002-postgres-postgrest-custom-auth.md.
--
-- Design notes:
--   * Password hashing uses pgcrypto's `crypt()`/`gen_salt('bf', 10)`, which is
--     the same primitive GoTrue uses. That means the bcrypt hashes already in
--     supabase/seeds/00_comprehensive_users.sql keep working unchanged.
--   * Every function is SECURITY DEFINER with an explicit `search_path`, and
--     EXECUTE is revoked from `public`/`anon`/`authenticated`. Only `service_role`
--     (the API's admin client) may call them, so the `auth` schema stays
--     unreachable from PostgREST while the API still uses the same PostgREST
--     transport as every other data access in this codebase.
--   * Opaque tokens (magic links, refresh tokens) are stored as SHA-256 hashes.
--     A database leak therefore does not yield usable tokens.
--   * Refresh rotation revokes the presented token and issues a replacement. If
--     an already-revoked token is presented again (replay), the entire token
--     family for that user is revoked.
-- ============================================================================

-- pgcrypto provides crypt(), gen_salt(), digest() and gen_random_bytes().
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.auth_hash_token(p_token text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex')
$$;

-- ---------------------------------------------------------------------------
-- Password auth
-- ---------------------------------------------------------------------------

-- Returns the user id when the password matches, otherwise NULL.
-- Never reveals *why* authentication failed (unknown user vs wrong password).
create or replace function public.auth_verify_password(p_email text, p_password text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
begin
  if p_email is null or p_password is null then
    return null;
  end if;

  select u.id
    into v_user_id
    from auth.users u
   where lower(u.email) = lower(p_email)
     and u.encrypted_password is not null
     and u.encrypted_password = extensions.crypt(p_password, u.encrypted_password)
     and (u.banned_until is null or u.banned_until <= now());

  return v_user_id;
end;
$$;

-- Creates a user. Returns NULL when the email already exists (so the caller can
-- decide whether to surface that, without a unique-violation round trip).
create or replace function public.auth_create_user(
  p_email text,
  p_password text default null,
  p_display_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
begin
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'invalid email' using errcode = '22023';
  end if;

  insert into auth.users (
    email, encrypted_password, email_confirmed_at, raw_user_meta_data, aud, role
  )
  values (
    lower(p_email),
    case
      when p_password is null then null
      else extensions.crypt(p_password, extensions.gen_salt('bf', 10))
    end,
    -- Self-hosted sign-up confirms immediately: email delivery is the
    -- deployment's concern, and this mirrors enable_confirmations = false.
    now(),
    jsonb_build_object(
      'display_name', coalesce(p_display_name, split_part(lower(p_email), '@', 1))
    ),
    'authenticated',
    'authenticated'
  )
  returning id into v_user_id;

  -- Mirror GoTrue, which always links an email identity.
  insert into auth.identities (user_id, provider, provider_id, identity_data)
  values (
    v_user_id,
    'email',
    'email:' || v_user_id::text,
    jsonb_build_object(
      'email', lower(p_email),
      'sub', v_user_id::text,
      'email_verified', true
    )
  )
  on conflict (provider, provider_id) do nothing;

  return v_user_id;
exception
  when unique_violation then
    return null;
end;
$$;

-- Used by password reset / account flows.
create or replace function public.auth_set_password(p_user_id uuid, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf', 10))
   where id = p_user_id;
  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- Magic links
-- ---------------------------------------------------------------------------

-- Creates the user if needed (as GoTrue does), stores a hashed single-use token
-- and returns the raw token to embed in the emailed link.
create or replace function public.auth_create_magic_link(
  p_email text,
  p_ttl_seconds int default 3600,
  p_purpose text default 'magiclink'
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_token text;
begin
  select u.id into v_user_id from auth.users u where lower(u.email) = lower(p_email);

  if v_user_id is null then
    v_user_id := public.auth_create_user(p_email, null, null);
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into auth.magic_links (token_hash, user_id, email, purpose, expires_at)
  values (
    public.auth_hash_token(v_token),
    v_user_id,
    lower(p_email),
    p_purpose,
    now() + make_interval(secs => greatest(p_ttl_seconds, 60))
  );

  return v_token;
end;
$$;

-- Single-use: marks the link consumed and returns the user id, or NULL when the
-- token is unknown, already used, or expired.
create or replace function public.auth_consume_magic_link(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
begin
  if p_token is null then
    return null;
  end if;

  update auth.magic_links
     set consumed_at = now()
   where token_hash = public.auth_hash_token(p_token)
     and consumed_at is null
     and expires_at > now()
  returning user_id into v_user_id;

  return v_user_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Refresh tokens (opaque, rotated, reuse-detecting)
-- ---------------------------------------------------------------------------
create or replace function public.auth_issue_refresh_token(
  p_user_id uuid,
  p_ttl_seconds int default 2592000
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
begin
  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into auth.refresh_tokens (user_id, token_hash, expires_at)
  values (
    p_user_id,
    public.auth_hash_token(v_token),
    now() + make_interval(secs => greatest(p_ttl_seconds, 60))
  );

  return v_token;
end;
$$;

-- Rotates a refresh token. Returns one row (user_id, token) on success and no
-- rows when the token is unknown/expired/revoked.
--
-- Replay handling: presenting an already-rotated token means either a bug or a
-- stolen token, so every outstanding token for that user is revoked.
create or replace function public.auth_rotate_refresh_token(
  p_token text,
  p_ttl_seconds int default 2592000
)
returns table (user_id uuid, token text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row auth.refresh_tokens;
  v_new_token text;
begin
  select rt.* into v_row
    from auth.refresh_tokens rt
   where rt.token_hash = public.auth_hash_token(p_token)
     for update;

  if not found then
    return;
  end if;

  if v_row.revoked then
    update auth.refresh_tokens rt
       set revoked = true
     where rt.user_id = v_row.user_id
       and rt.revoked = false;
    return;
  end if;

  if v_row.expires_at <= now() then
    return;
  end if;

  update auth.refresh_tokens rt set revoked = true where rt.id = v_row.id;

  v_new_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into auth.refresh_tokens (user_id, token_hash, rotated_from, expires_at)
  values (
    v_row.user_id,
    public.auth_hash_token(v_new_token),
    v_row.id,
    now() + make_interval(secs => greatest(p_ttl_seconds, 60))
  );

  user_id := v_row.user_id;
  token := v_new_token;
  return next;
end;
$$;

create or replace function public.auth_revoke_refresh_token(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update auth.refresh_tokens rt
     set revoked = true
   where rt.token_hash = public.auth_hash_token(p_token)
     and rt.revoked = false;
  return found;
end;
$$;

create or replace function public.auth_revoke_all_user_tokens(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_count integer;
begin
  update auth.refresh_tokens rt
     set revoked = true
   where rt.user_id = p_user_id
     and rt.revoked = false;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- User lookup (for building JWT claims / the /auth/user response)
-- ---------------------------------------------------------------------------
create or replace function public.auth_get_user(p_user_id uuid)
returns table (
  id uuid,
  email text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb,
  banned_until timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public, extensions
as $$
  select u.id,
         u.email,
         u.email_confirmed_at,
         u.raw_user_meta_data,
         u.banned_until,
         u.created_at
    from auth.users u
   where u.id = p_user_id
$$;

-- ---------------------------------------------------------------------------
-- Privileges: service_role only.
-- ---------------------------------------------------------------------------
do $$
declare
  fn text;
  fns text[] := array[
    'public.auth_hash_token(text)',
    'public.auth_verify_password(text, text)',
    'public.auth_create_user(text, text, text)',
    'public.auth_set_password(uuid, text)',
    'public.auth_create_magic_link(text, int, text)',
    'public.auth_consume_magic_link(text)',
    'public.auth_issue_refresh_token(uuid, int)',
    'public.auth_rotate_refresh_token(text, int)',
    'public.auth_revoke_refresh_token(text)',
    'public.auth_revoke_all_user_tokens(uuid)',
    'public.auth_get_user(uuid)'
  ];
begin
  foreach fn in array fns loop
    execute format('revoke all on function %s from public', fn);
    execute format('revoke all on function %s from anon', fn);
    execute format('revoke all on function %s from authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end
$$;

-- Housekeeping helper, callable by the worker's cleanup job.
create or replace function public.auth_purge_expired_tokens(p_older_than_days int default 30)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_count integer := 0;
  v_deleted integer;
begin
  delete from auth.magic_links
   where expires_at < now() - make_interval(days => p_older_than_days);
  get diagnostics v_deleted = row_count;
  v_count := v_count + v_deleted;

  delete from auth.refresh_tokens
   where expires_at < now() - make_interval(days => p_older_than_days);
  get diagnostics v_deleted = row_count;
  v_count := v_count + v_deleted;

  return v_count;
end;
$$;

revoke all on function public.auth_purge_expired_tokens(int) from public, anon, authenticated;
grant execute on function public.auth_purge_expired_tokens(int) to service_role;

-- PostgREST caches the schema; without this, calls to the functions above fail
-- with PGRST202 ("could not find the function ... in the schema cache") until it
-- restarts. Harmless when PostgREST is not running.
notify pgrst, 'reload schema';
