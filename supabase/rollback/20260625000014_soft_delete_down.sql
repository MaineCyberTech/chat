-- Rollback for: 20260625000014_soft_delete.sql
-- Generated on: ...

BEGIN;

DROP FUNCTION IF EXISTS public.restore_message CASCADE;
DROP FUNCTION IF EXISTS public.restore_channel CASCADE;
DROP FUNCTION IF EXISTS public.restore_workspace CASCADE;
DROP FUNCTION IF EXISTS public.soft_delete_message CASCADE;
DROP FUNCTION IF EXISTS public.soft_delete_channel CASCADE;
DROP FUNCTION IF EXISTS public.soft_delete_workspace CASCADE;
DROP POLICY IF EXISTS "messages_select_member" ON public.messages;
DROP POLICY IF EXISTS "channels_select_member" ON public.channels;
DROP POLICY IF EXISTS "workspaces_select_member" ON public.workspaces;
DROP INDEX IF EXISTS idx_messages_deleted_at;
DROP INDEX IF EXISTS idx_channels_deleted_at;
DROP INDEX IF EXISTS idx_workspaces_deleted_at;
ALTER TABLE IF EXISTS public.messages DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE IF EXISTS public.channels DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE IF EXISTS public.workspaces DROP COLUMN IF EXISTS deleted_at;

COMMIT;
