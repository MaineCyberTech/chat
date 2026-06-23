-- 007_add_missing_indexes.sql
-- Add missing indexes for query performance
-- Run after 006_user_preferences.sql

-- Index for workspace_members.user_id (most common query: "find all workspaces for user X")
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id
  ON public.workspace_members (user_id);

-- Index for channel_members.user_id (query: "find all channels for user X")
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id
  ON public.channel_members (user_id);

-- Partial index for messages.parent_id (threaded replies)
CREATE INDEX IF NOT EXISTS idx_messages_parent_id
  ON public.messages (parent_id) WHERE parent_id IS NOT NULL;