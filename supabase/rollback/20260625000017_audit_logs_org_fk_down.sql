-- Rollback for: 20260625000017_audit_logs_org_fk.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "audit_logs_select_authenticated";

COMMIT;
