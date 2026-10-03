-- Rollback for: 20260625000019_feature_flags.sql
-- Generated on: ...

BEGIN;

DROP TRIGGER IF EXISTS feature_flags_updated_at ON public.feature_flags;
DROP POLICY IF EXISTS "feature_flags_manage_admin" ON public.feature_flags;
DROP POLICY IF EXISTS "feature_flags_select_admin" ON public.feature_flags;
ALTER TABLE IF EXISTS public.feature_flags DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_feature_flags_enabled;
DROP TABLE IF EXISTS public.feature_flags CASCADE;

COMMIT;
