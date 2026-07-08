-- Add performance indexes identified by API response time analysis

-- Enable pg_trgm extension for trigram-based text search indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Composite index for channel message listing (listByChannel query)
-- The most common query pattern: SELECT ... FROM messages WHERE channel_id = ?
-- ORDER BY created_at DESC LIMIT N. Without this, Postgres scans + sorts.
CREATE INDEX IF NOT EXISTS idx_messages_channel_created
  ON public.messages (channel_id, created_at DESC);

-- Composite index for workspace-filtered notification listing
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_created
  ON public.notifications (workspace_id, created_at DESC)
  WHERE workspace_id IS NOT NULL;

-- Partial index for unread notification count queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created
  ON public.notifications (user_id, read, created_at DESC);

-- Index for DM channel listing
CREATE INDEX IF NOT EXISTS idx_dm_members_user_id
  ON public.dm_members (user_id);

-- Composite index for flagged messages listing
CREATE INDEX IF NOT EXISTS idx_message_flags_user_created
  ON public.message_flags (user_id, created_at DESC);

-- Composite index for channel member existence checks (fast membership lookup)
CREATE INDEX IF NOT EXISTS idx_channel_members_user_channel
  ON public.channel_members (user_id, channel_id);

-- Index for workspace members role queries
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_role
  ON public.workspace_members (workspace_id, role);

-- Covering index for message edit history lookups by message id
CREATE INDEX IF NOT EXISTS idx_message_edit_history_message
  ON public.message_edit_history (message_id, edited_at ASC);

-- Index for channel slug dedup lookups
CREATE INDEX IF NOT EXISTS idx_channels_workspace_slug
  ON public.channels (workspace_id, slug);

-- GIN index on user display_name for autocomplete/mention search
CREATE INDEX IF NOT EXISTS idx_users_display_name_trgm
  ON public.users USING GIN (display_name gin_trgm_ops);

-- GIN index on user email for admin user search
CREATE INDEX IF NOT EXISTS idx_users_email_trgm
  ON public.users USING GIN (email gin_trgm_ops);

-- Index for user presence lookups (most common query: login status check)
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id
  ON public.user_presence (user_id);

COMMENT ON INDEX idx_messages_channel_created IS 'Speeds up channel message listing sorted by newest first';
COMMENT ON INDEX idx_notifications_workspace_created IS 'Speeds up workspace-filtered notification listing';
COMMENT ON INDEX idx_dm_members_user_id IS 'Speeds up DM channel listing per user';
COMMENT ON INDEX idx_message_flags_user_created IS 'Speeds up flagged messages listing per user';
COMMENT ON INDEX idx_channel_members_user_channel IS 'Speeds up channel membership existence checks';
COMMENT ON INDEX idx_channels_workspace_slug IS 'Speeds up channel lookup by workspace and slug';
COMMENT ON INDEX idx_users_display_name_trgm IS 'Speeds up user autocomplete/mention search via ILIKE';
COMMENT ON INDEX idx_users_email_trgm IS 'Speeds up admin user search by email';
COMMENT ON INDEX idx_user_presence_user_id IS 'Speeds up user presence status lookups';
