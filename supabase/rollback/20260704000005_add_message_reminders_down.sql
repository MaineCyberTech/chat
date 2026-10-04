-- Rollback for: 20260704000005_add_message_reminders.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "Users manage their own reminders" ON public.message_reminders;
ALTER TABLE IF EXISTS public.message_reminders DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_message_reminders_user;
DROP INDEX IF EXISTS idx_message_reminders_due;
DROP TABLE IF EXISTS public.message_reminders CASCADE;

COMMIT;
