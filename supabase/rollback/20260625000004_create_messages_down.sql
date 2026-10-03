-- Rollback for: 20260625000004_create_messages.sql
-- Generated on: ...

BEGIN;

ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_messages_channel_created;
DROP TABLE IF EXISTS public.messages CASCADE;

COMMIT;
