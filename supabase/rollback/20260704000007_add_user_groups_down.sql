-- Rollback for: 20260704000007_add_user_groups.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "Admins can manage group members" ON public.user_group_members;
DROP POLICY IF EXISTS "Group members can view member list" ON public.user_group_members;
DROP POLICY IF EXISTS "Admins can delete groups" ON public.user_groups;
DROP POLICY IF EXISTS "Admins can update groups" ON public.user_groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON public.user_groups;
DROP POLICY IF EXISTS "Workspace members can view groups" ON public.user_groups;
ALTER TABLE IF EXISTS public.user_group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_groups DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_user_group_members_user;
DROP INDEX IF EXISTS idx_user_group_members_group;
DROP INDEX IF EXISTS idx_user_groups_workspace;
DROP TABLE IF EXISTS public.user_group_members CASCADE;
DROP TABLE IF EXISTS public.user_groups CASCADE;

COMMIT;
