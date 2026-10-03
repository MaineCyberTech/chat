-- Rollback for: 20260625000010_create_audit_logs.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "audit_logs_insert_authenticated" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_authenticated" ON public.audit_logs;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_audit_logs_actor;
DROP INDEX IF EXISTS idx_audit_logs_org_created_at;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

COMMIT;
