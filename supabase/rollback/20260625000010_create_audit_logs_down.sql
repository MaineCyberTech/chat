-- Rollback for: 20260625000010_create_audit_logs.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP INDEX IF EXISTS idx_audit_logs_org_created_at;
DROP INDEX IF EXISTS idx_audit_logs_actor;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_select_authenticated";
DROP POLICY IF EXISTS "audit_logs_insert_authenticated";

COMMIT;
