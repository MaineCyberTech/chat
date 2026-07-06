-- Rollback for: 20260625000004_create_messages.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.messages CASCADE;
DROP INDEX IF EXISTS idx_messages_channel_created;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

COMMIT;
