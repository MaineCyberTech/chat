-- Rollback for: 20260625000015_data_retention.sql
-- Generated on: ...

BEGIN;

DROP INDEX IF EXISTS idx_messages_archived_at;
DROP FUNCTION IF EXISTS public.archive_old_messages(;
-- Manual rollback needed: UPDATE on public.messages
DROP FUNCTION IF EXISTS public.purge_archived_messages(;

COMMIT;
