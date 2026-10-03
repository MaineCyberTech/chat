-- supabase/tests/rls_tenant_isolation.sql
--
-- Real-database Row Level Security (RLS) tenant-isolation tests.
--
-- Closes TEST-P2-003 ("No real-database/RLS integration test tier"). The unit
-- suite mocks Supabase, so tenant-isolation regressions (anon-client usage,
-- policy drift, missing RLS) are invisible to it. This test runs against a real
-- Postgres with every migration + seed applied (`supabase db reset`) and asserts
-- that an authenticated tenant cannot read another tenant's rows.
--
-- Run:
--   supabase db reset
--   docker exec -i supabase_db_chat psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f - < supabase/tests/rls_tenant_isolation.sql
--
-- Any failed assertion raises an exception, so psql exits non-zero.
-- The whole test runs in one transaction and is rolled back; it never mutates
-- the database.

\set ON_ERROR_STOP on

begin;

-- ---------------------------------------------------------------------------
-- Fixtures (supabase/seeds/01_comprehensive_workspaces.sql):
--   Acme Corp : b0000001-...  members include a0000004 (Elena, role member)
--   TechStart : b0000002-...  owner a0000012; a0000004 is NOT a member
--   DesignHub : b0000003-...  a0000004 is NOT a member
-- User a0000004 (Elena) belongs to Acme only, so she is a clean probe for
-- cross-tenant isolation. User a0000012 (Nkechi) owns TechStart only.
-- ---------------------------------------------------------------------------

-- Guard: fail loudly if the seed fixtures are missing, instead of passing
-- vacuously because there is nothing to leak.
do $$
begin
  if not exists (
      select 1 from public.workspaces
      where id = 'b0000001-0000-4000-8000-000000000001')
     or not exists (
      select 1 from public.workspace_members
      where workspace_id = 'b0000001-0000-4000-8000-000000000001'
        and user_id = 'a0000004-0000-4000-8000-000000000004')
     or exists (
      select 1 from public.workspace_members
      where workspace_id = 'b0000002-0000-4000-8000-000000000002'
        and user_id = 'a0000004-0000-4000-8000-000000000004')
  then
    raise exception
      'RLS fixture precondition failed: run `supabase db reset` (with seeds) before this test';
  end if;
end $$;

-- Act as an authenticated Elena (a0000004), a member of Acme only.
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"a0000004-0000-4000-8000-000000000004","role":"authenticated"}';

do $$
declare
  own_workspaces     int;
  foreign_workspaces int;
  foreign_members    int;
  foreign_channels   int;
  foreign_messages   int;
  own_channels       int;
  own_messages       int;
begin
  -- auth.uid() must resolve from the simulated JWT, otherwise the test is not
  -- exercising the authenticated role at all.
  if auth.uid() is distinct from 'a0000004-0000-4000-8000-000000000004'::uuid then
    raise exception 'auth.uid() did not resolve from request.jwt.claims (got %)', auth.uid();
  end if;

  -- Positive control: the member can see their own workspace.
  select count(*) into own_workspaces from public.workspaces
   where id = 'b0000001-0000-4000-8000-000000000001';
  if own_workspaces <> 1 then
    raise exception 'POSITIVE CONTROL: member cannot see their own workspace (got %)', own_workspaces;
  end if;

  -- Cross-tenant reads must return zero rows.
  select count(*) into foreign_workspaces from public.workspaces
   where id in ('b0000002-0000-4000-8000-000000000002',
                'b0000003-0000-4000-8000-000000000003');
  if foreign_workspaces <> 0 then
    raise exception 'TENANT LEAK: foreign workspaces visible = %', foreign_workspaces;
  end if;

  select count(*) into foreign_members from public.workspace_members
   where workspace_id in ('b0000002-0000-4000-8000-000000000002',
                          'b0000003-0000-4000-8000-000000000003');
  if foreign_members <> 0 then
    raise exception 'TENANT LEAK: foreign workspace_members visible = %', foreign_members;
  end if;

  select count(*) into foreign_channels from public.channels
   where workspace_id in ('b0000002-0000-4000-8000-000000000002',
                          'b0000003-0000-4000-8000-000000000003');
  if foreign_channels <> 0 then
    raise exception 'TENANT LEAK: foreign channels visible = %', foreign_channels;
  end if;

  select count(*) into foreign_messages
    from public.messages m
    join public.channels c on c.id = m.channel_id
   where c.workspace_id in ('b0000002-0000-4000-8000-000000000002',
                            'b0000003-0000-4000-8000-000000000003');
  if foreign_messages <> 0 then
    raise exception 'TENANT LEAK: foreign messages visible = %', foreign_messages;
  end if;

  -- Positive controls: own-tenant rows remain visible (policy is not simply
  -- denying everything, which would make the leak assertions vacuous).
  select count(*) into own_channels from public.channels
   where workspace_id = 'b0000001-0000-4000-8000-000000000001';
  if own_channels = 0 then
    raise exception 'POSITIVE CONTROL: no own channels visible';
  end if;

  select count(*) into own_messages
    from public.messages m
    join public.channels c on c.id = m.channel_id
   where c.workspace_id = 'b0000001-0000-4000-8000-000000000001';
  if own_messages = 0 then
    raise exception 'POSITIVE CONTROL: no own messages visible';
  end if;
end $$;

-- Second probe: the TechStart owner (a0000012) must not see Acme/DesignHub.
set local request.jwt.claims =
  '{"sub":"a0000012-0000-4000-8000-000000000012","role":"authenticated"}';

do $$
declare
  foreign_workspaces int;
begin
  if auth.uid() is distinct from 'a0000012-0000-4000-8000-000000000012'::uuid then
    raise exception 'auth.uid() did not resolve for second probe (got %)', auth.uid();
  end if;

  select count(*) into foreign_workspaces from public.workspaces
   where id in ('b0000001-0000-4000-8000-000000000001',
                'b0000003-0000-4000-8000-000000000003');
  if foreign_workspaces <> 0 then
    raise exception 'TENANT LEAK: TechStart owner sees foreign workspaces = %', foreign_workspaces;
  end if;
end $$;

-- Never mutate the database.
reset role;
rollback;

\echo 'RLS_TENANT_ISOLATION: PASS'
