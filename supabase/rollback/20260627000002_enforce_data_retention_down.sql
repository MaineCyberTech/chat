-- Rollback for: 20260627000002_enforce_data_retention.sql
-- Generated on: ...

BEGIN;

DROP FUNCTION IF EXISTS public.purge_old_audit_logs();
DROP FUNCTION IF EXISTS public.purge_old_notifications();
DROP FUNCTION IF EXISTS public.purge_old_consent_logs();

COMMIT;
