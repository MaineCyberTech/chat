-- Rollback for: 20260625000006_create_user_preferences.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.user_preferences CASCADE;
ALTER TABLE public.user_preferences DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_preferences_select_own";
DROP POLICY IF EXISTS "user_preferences_insert_own";
DROP POLICY IF EXISTS "user_preferences_update_own";

COMMIT;
