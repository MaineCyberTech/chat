-- Rollback for: 20260704000006_add_custom_emoji.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.custom_emoji CASCADE;
DROP INDEX IF EXISTS idx_custom_emoji_workspace;
ALTER TABLE public.custom_emoji DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace;
DROP POLICY IF EXISTS "Admins;
DROP POLICY IF EXISTS "Admins;

COMMIT;
