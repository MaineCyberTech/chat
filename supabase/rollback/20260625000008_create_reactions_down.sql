-- Rollback for: 20260625000008_create_reactions.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "reactions_delete_own" ON public.reactions;
DROP POLICY IF EXISTS "reactions_insert_own" ON public.reactions;
DROP POLICY IF EXISTS "reactions_select" ON public.reactions;
ALTER TABLE IF EXISTS public.reactions DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.reactions CASCADE;

COMMIT;
