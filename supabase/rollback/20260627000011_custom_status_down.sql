-- Rollback for: 20260627000011_custom_status.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.user_statuses CASCADE;
ALTER TABLE public.user_statuses DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_statuses_select";
DROP POLICY IF EXISTS "user_statuses_upsert_own";
DROP POLICY IF EXISTS "user_statuses_update_own";
DROP POLICY IF EXISTS "user_statuses_delete_own";

COMMIT;
