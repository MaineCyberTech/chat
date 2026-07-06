-- Rollback for: 20260627000007_fix_rls_recursion.sql
-- Generated on: ...

BEGIN;

DROP FUNCTION IF EXISTS public.channel_workspace(channel_id;
DROP POLICY IF EXISTS "channel_role_overrides_select_member";

COMMIT;
