-- Rollback for: 20260625000015_data_retention.sql
-- Generated on: ...

BEGIN;

DROP FUNCTION IF EXISTS public.purge_archived_messages CASCADE;
DROP FUNCTION IF EXISTS public.archive_old_messages CASCADE;
DROP INDEX IF EXISTS idx_messages_archived_at;
ALTER TABLE IF EXISTS public.messages DROP COLUMN IF EXISTS archived_at;

COMMIT;
