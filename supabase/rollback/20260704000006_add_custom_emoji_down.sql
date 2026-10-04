-- Rollback for: 20260704000006_add_custom_emoji.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "Admins can delete custom emoji" ON public.custom_emoji;
DROP POLICY IF EXISTS "Admins can manage custom emoji" ON public.custom_emoji;
DROP POLICY IF EXISTS "Workspace members can view custom emoji" ON public.custom_emoji;
ALTER TABLE IF EXISTS public.custom_emoji DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_custom_emoji_workspace;
DROP TABLE IF EXISTS public.custom_emoji CASCADE;

COMMIT;
