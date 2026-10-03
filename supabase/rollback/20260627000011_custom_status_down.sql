-- Rollback for: 20260627000011_custom_status.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "user_statuses_delete_own" ON public.user_statuses;
DROP POLICY IF EXISTS "user_statuses_update_own" ON public.user_statuses;
DROP POLICY IF EXISTS "user_statuses_upsert_own" ON public.user_statuses;
DROP POLICY IF EXISTS "user_statuses_select" ON public.user_statuses;
ALTER TABLE IF EXISTS public.user_statuses DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.user_statuses CASCADE;

COMMIT;
