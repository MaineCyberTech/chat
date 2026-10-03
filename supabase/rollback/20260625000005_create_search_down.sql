-- Rollback for: 20260625000005_create_search.sql
-- Generated on: ...

BEGIN;

DROP FUNCTION IF EXISTS public.search_messages CASCADE;
DROP INDEX IF EXISTS idx_messages_content_fts;

COMMIT;
