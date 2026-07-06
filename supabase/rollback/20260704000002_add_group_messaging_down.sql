-- Rollback for: 20260704000002_add_group_messaging.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.dm_members CASCADE;
DROP INDEX IF EXISTS idx_dm_members_channel;
DROP INDEX IF EXISTS idx_dm_members_user;
ALTER TABLE public.dm_members DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users;
DROP POLICY IF EXISTS "Users;

COMMIT;
