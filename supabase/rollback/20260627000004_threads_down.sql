-- Rollback for: 20260627000004_threads.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.thread_metadata CASCADE;
DROP TABLE IF EXISTS public.thread_participants CASCADE;
ALTER TABLE public.thread_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_participants DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "thread_metadata_select_workspace_member";
DROP POLICY IF EXISTS "thread_participants_select";
DROP POLICY IF EXISTS "thread_participants_insert_own";
DROP INDEX IF EXISTS idx_thread_metadata_last_activity;
DROP INDEX IF EXISTS idx_thread_participants_user;
DROP FUNCTION IF EXISTS public.handle_thread_reply();
-- Manual rollback needed: UPDATE on SET
-- Manual rollback needed: UPDATE on SET
DROP TRIGGER IF EXISTS on_message_reply;

COMMIT;
