-- Rollback for: 20260704000002_add_group_messaging.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "Users can join DMs they're part of" ON public.dm_members;
DROP POLICY IF EXISTS "Users can view their own DM memberships" ON public.dm_members;
ALTER TABLE IF EXISTS public.dm_members DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_dm_members_user;
DROP INDEX IF EXISTS idx_dm_members_channel;
DROP TABLE IF EXISTS public.dm_members CASCADE;

COMMIT;
