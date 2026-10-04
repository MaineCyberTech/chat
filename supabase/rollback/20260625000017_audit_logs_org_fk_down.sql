-- Rollback for: 20260625000017_audit_logs_org_fk.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "audit_logs_select_authenticated" ON public.audit_logs;
ALTER TABLE IF EXISTS public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_organization_id_fkey;

COMMIT;
