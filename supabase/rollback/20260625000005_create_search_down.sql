-- Rollback for: 20260625000005_create_search.sql
-- Generated on: ...

BEGIN;

DROP INDEX IF EXISTS idx_messages_content_fts;
DROP FUNCTION IF EXISTS public.search_messages(;

COMMIT;
