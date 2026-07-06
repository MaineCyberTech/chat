-- Rollback for: 20260626000001_fix_workspace_member_trigger.sql
-- Generated on: ...

BEGIN;

DROP FUNCTION IF EXISTS public.handle_new_workspace();

COMMIT;
