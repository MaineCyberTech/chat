-- Rollback for: 20260627000005_notification_preferences.sql
-- Generated on: ...

BEGIN;

DROP INDEX IF EXISTS idx_notification_preferences_user;
DROP POLICY IF EXISTS "notification_preferences_update_own" ON public.notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_insert_own" ON public.notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_select_own" ON public.notification_preferences;
ALTER TABLE IF EXISTS public.notification_preferences DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;

COMMIT;
