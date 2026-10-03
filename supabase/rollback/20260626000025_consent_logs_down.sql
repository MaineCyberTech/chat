-- Rollback for: 20260626000025_consent_logs.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "Users can insert own consent" ON public.consent_logs;
DROP POLICY IF EXISTS "Users can view own consent" ON public.consent_logs;
ALTER TABLE IF EXISTS public.consent_logs DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_consent_logs_user_id;
DROP TABLE IF EXISTS public.consent_logs CASCADE;

COMMIT;
