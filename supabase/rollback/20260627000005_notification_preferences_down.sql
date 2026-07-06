-- Rollback for: 20260627000005_notification_preferences.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.notification_preferences CASCADE;
ALTER TABLE public.notification_preferences DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notification_preferences_select_own";
DROP POLICY IF EXISTS "notification_preferences_insert_own";
DROP POLICY IF EXISTS "notification_preferences_update_own";
DROP INDEX IF EXISTS idx_notification_preferences_user;

COMMIT;
