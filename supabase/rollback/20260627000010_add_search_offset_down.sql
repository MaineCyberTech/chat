-- Rollback for: 20260627000010_add_search_offset.sql
-- Generated on: ...

BEGIN;

DROP FUNCTION IF EXISTS public.search_messages(;

COMMIT;
