-- Rollback for: 20260625000006_create_user_preferences.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_insert_own" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_select_own" ON public.user_preferences;
ALTER TABLE IF EXISTS public.user_preferences DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.user_preferences CASCADE;

COMMIT;
