-- Rollback for: 20260703000001_add_message_features.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "Users can insert their own edits" ON public.message_edit_history;
DROP POLICY IF EXISTS "Channel members can view edit history" ON public.message_edit_history;
ALTER TABLE IF EXISTS public.message_edit_history DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_message_edit_history_message;
DROP TABLE IF EXISTS public.message_edit_history CASCADE;
DROP POLICY IF EXISTS "Users can manage their own flags" ON public.message_flags;
ALTER TABLE IF EXISTS public.message_flags DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_message_flags_message;
DROP INDEX IF EXISTS idx_message_flags_user;
DROP TABLE IF EXISTS public.message_flags CASCADE;
DROP INDEX IF EXISTS idx_messages_channel_pinned;
ALTER TABLE IF EXISTS public.messages DROP COLUMN IF EXISTS is_pinned;

COMMIT;
