-- Rollback for: 20260627000004_threads.sql
-- Generated on: ...

BEGIN;

DROP TRIGGER IF EXISTS on_message_reply ON public.messages;
DROP FUNCTION IF EXISTS public.handle_thread_reply CASCADE;
DROP INDEX IF EXISTS idx_thread_participants_user;
DROP INDEX IF EXISTS idx_thread_metadata_last_activity;
DROP POLICY IF EXISTS "thread_participants_insert_own" ON public.thread_participants;
DROP POLICY IF EXISTS "thread_participants_select" ON public.thread_participants;
DROP POLICY IF EXISTS "thread_metadata_select_workspace_member" ON public.thread_metadata;
ALTER TABLE IF EXISTS public.thread_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.thread_metadata DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.thread_participants CASCADE;
DROP TABLE IF EXISTS public.thread_metadata CASCADE;

COMMIT;
