-- Rollback for: 20260626000025_consent_logs.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.consent_logs CASCADE;
DROP INDEX IF EXISTS idx_consent_logs_user_id;
ALTER TABLE public.consent_logs DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users;
DROP POLICY IF EXISTS "Users;

COMMIT;
