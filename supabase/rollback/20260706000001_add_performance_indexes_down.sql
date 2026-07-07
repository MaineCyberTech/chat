-- Drop performance indexes (reverse of 20260706000001_add_performance_indexes.sql)
DROP INDEX IF EXISTS idx_messages_channel_created;
DROP INDEX IF EXISTS idx_notifications_workspace_created;
DROP INDEX IF EXISTS idx_notifications_user_unread_created;
DROP INDEX IF EXISTS idx_dm_members_user_id;
DROP INDEX IF EXISTS idx_message_flags_user_created;
DROP INDEX IF EXISTS idx_channel_members_user_channel;
DROP INDEX IF EXISTS idx_workspace_members_workspace_role;
DROP INDEX IF EXISTS idx_message_edit_history_message;
DROP INDEX IF EXISTS idx_channels_workspace_slug;
DROP INDEX IF EXISTS idx_users_display_name_trgm;
DROP INDEX IF EXISTS idx_users_email_trgm;
