-- Rollback for: 20260625000019_feature_flags.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.feature_flags CASCADE;
DROP INDEX IF EXISTS idx_feature_flags_enabled;
ALTER TABLE public.feature_flags DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feature_flags_select_admin";
DROP POLICY IF EXISTS "feature_flags_manage_admin";
DROP TRIGGER IF EXISTS feature_flags_updated_at;
-- Manual rollback needed: UPDATE on on

COMMIT;
