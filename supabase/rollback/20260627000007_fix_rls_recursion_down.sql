-- Rollback for: 20260627000007_fix_rls_recursion.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "channel_role_overrides_select_member" ON public.channel_role_overrides;
DROP FUNCTION IF EXISTS public.channel_workspace CASCADE;

COMMIT;
