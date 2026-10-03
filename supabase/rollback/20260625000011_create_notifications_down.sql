-- Rollback for: 20260625000011_create_notifications.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP TABLE IF EXISTS public.notifications CASCADE;

COMMIT;
