-- Rollback for: 20260625000011_create_notifications.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.notifications CASCADE;
DROP INDEX IF EXISTS idx_notifications_user_unread;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users;
DROP POLICY IF EXISTS "Users;

COMMIT;
