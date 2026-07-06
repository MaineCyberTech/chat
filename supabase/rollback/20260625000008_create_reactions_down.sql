-- Rollback for: 20260625000008_create_reactions.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.reactions CASCADE;
ALTER TABLE public.reactions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reactions_select";
DROP POLICY IF EXISTS "reactions_insert_own";
DROP POLICY IF EXISTS "reactions_delete_own";

COMMIT;
