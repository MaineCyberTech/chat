-- Rollback for: 20260703000001_add_message_features.sql
-- Generated on: ...

BEGIN;

ALTER TABLE public.messages DROP COLUMN IF EXISTS is_pinned;
DROP INDEX IF EXISTS idx_messages_channel_pinned;
DROP TABLE IF EXISTS public.message_flags CASCADE;
DROP INDEX IF EXISTS idx_message_flags_user;
DROP INDEX IF EXISTS idx_message_flags_message;
ALTER TABLE public.message_flags DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users;
DROP TABLE IF EXISTS public.message_edit_history CASCADE;
DROP INDEX IF EXISTS idx_message_edit_history_message;
ALTER TABLE public.message_edit_history DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Channel;
DROP POLICY IF EXISTS "Users;

COMMIT;
