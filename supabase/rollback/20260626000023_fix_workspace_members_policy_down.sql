-- Rollback for: 20260626000023_fix_workspace_members_policy.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "workspace_members_select_own";

COMMIT;
