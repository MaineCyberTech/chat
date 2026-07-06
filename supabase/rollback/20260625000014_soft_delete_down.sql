-- Rollback for: 20260625000014_soft_delete.sql
-- Generated on: ...

BEGIN;

DROP INDEX IF EXISTS idx_workspaces_deleted_at;
DROP INDEX IF EXISTS idx_channels_deleted_at;
DROP INDEX IF EXISTS idx_messages_deleted_at;
DROP POLICY IF EXISTS "workspaces_select_member";
DROP POLICY IF EXISTS "channels_select_member";
DROP POLICY IF EXISTS "messages_select_member";
DROP FUNCTION IF EXISTS public.soft_delete_workspace(workspace_id;
-- Manual rollback needed: UPDATE on public.workspaces
DROP FUNCTION IF EXISTS public.soft_delete_channel(channel_id;
-- Manual rollback needed: UPDATE on public.channels
DROP FUNCTION IF EXISTS public.soft_delete_message(message_id;
-- Manual rollback needed: UPDATE on public.messages
DROP FUNCTION IF EXISTS public.restore_workspace(workspace_id;
-- Manual rollback needed: UPDATE on public.workspaces
DROP FUNCTION IF EXISTS public.restore_channel(channel_id;
-- Manual rollback needed: UPDATE on public.channels
DROP FUNCTION IF EXISTS public.restore_message(message_id;
-- Manual rollback needed: UPDATE on public.messages

COMMIT;
