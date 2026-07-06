-- Rollback for: 20260627000008_simplify_rls_policies.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS channels_select_member;
DROP POLICY IF EXISTS messages_select_member;

COMMIT;
