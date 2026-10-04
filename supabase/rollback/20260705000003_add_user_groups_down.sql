-- Rollback for: 20260705000003_add_user_groups.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "Group creators manage members" ON public.user_group_members;
DROP POLICY IF EXISTS "Group members visible to workspace members" ON public.user_group_members;
DROP POLICY IF EXISTS "Group creators can delete their groups" ON public.user_groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.user_groups;
DROP POLICY IF EXISTS "Users create and manage their own groups" ON public.user_groups;
DROP POLICY IF EXISTS "Groups are visible to workspace members" ON public.user_groups;
ALTER TABLE IF EXISTS public.user_group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_groups DISABLE ROW LEVEL SECURITY;

COMMIT;
