-- Rollback for: 20260704000005_add_message_reminders.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.message_reminders CASCADE;
DROP INDEX IF EXISTS idx_message_reminders_due;
DROP INDEX IF EXISTS idx_message_reminders_user;
ALTER TABLE public.message_reminders DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users;

COMMIT;
