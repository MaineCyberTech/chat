-- 009_soft_delete.sql
-- Add soft delete support for workspaces, channels, messages
-- Run after 008_audit_log_pruning.sql

-- Add deleted_at column to workspaces
ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at column to channels
ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at column to messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add partial indexes for performance (only index non-deleted rows)
CREATE INDEX IF NOT EXISTS idx_workspaces_deleted_at
  ON public.workspaces (deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_channels_deleted_at
  ON public.channels (deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_deleted_at
  ON public.messages (deleted_at) WHERE deleted_at IS NOT NULL;

-- Update RLS policies to exclude soft-deleted items by default
-- Workspaces: exclude deleted workspaces from SELECT
DROP POLICY IF EXISTS "workspaces_select_member" ON public.workspaces;
CREATE POLICY "workspaces_select_member"
ON public.workspaces FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = workspaces.id
    AND user_id = auth.uid()
  )
);

-- Channels: exclude deleted channels from SELECT
DROP POLICY IF EXISTS "channels_select_member" ON public.channels;
CREATE POLICY "channels_select_member"
ON public.channels FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = channels.workspace_id
    AND user_id = auth.uid()
  )
);

-- Messages: exclude deleted messages from SELECT
DROP POLICY IF EXISTS "messages_select_member" ON public.messages;
CREATE POLICY "messages_select_member"
ON public.messages FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.channels ch
    JOIN public.workspace_members wm ON wm.workspace_id = ch.workspace_id
    WHERE ch.id = messages.channel_id
    AND wm.user_id = auth.uid()
  )
);

-- Soft delete functions
CREATE OR REPLACE FUNCTION public.soft_delete_workspace(workspace_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.workspaces
  SET deleted_at = NOW()
  WHERE id = workspace_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.soft_delete_channel(channel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.channels
  SET deleted_at = NOW()
  WHERE id = channel_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.soft_delete_message(message_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.messages
  SET deleted_at = NOW()
  WHERE id = message_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Restore functions
CREATE OR REPLACE FUNCTION public.restore_workspace(workspace_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.workspaces
  SET deleted_at = NULL
  WHERE id = workspace_id AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.restore_channel(channel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.channels
  SET deleted_at = NULL
  WHERE id = channel_id AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.restore_message(message_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.messages
  SET deleted_at = NULL
  WHERE id = message_id AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;