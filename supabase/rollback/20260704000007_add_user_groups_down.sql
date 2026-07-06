-- Rollback for: 20260704000007_add_user_groups.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.user_groups CASCADE;
DROP TABLE IF EXISTS public.user_group_members CASCADE;
DROP INDEX IF EXISTS idx_user_groups_workspace;
DROP INDEX IF EXISTS idx_user_group_members_group;
DROP INDEX IF EXISTS idx_user_group_members_user;
ALTER TABLE public.user_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group_members DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace;
DROP POLICY IF EXISTS "Admins;
DROP POLICY IF EXISTS "Admins;
DROP POLICY IF EXISTS "Admins;
DROP POLICY IF EXISTS "Group;
DROP POLICY IF EXISTS "Admins;

COMMIT;
