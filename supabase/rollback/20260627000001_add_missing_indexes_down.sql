-- Rollback for: 20260627000001_add_missing_indexes.sql
-- Generated on: ...

BEGIN;

DROP INDEX IF EXISTS idx_reactions_message_id;
DROP INDEX IF EXISTS idx_reactions_user_id;
DROP INDEX IF EXISTS idx_notifications_workspace_id;
DROP INDEX IF EXISTS idx_webhook_deliveries_status_retry;
DROP INDEX IF EXISTS idx_webhook_deliveries_dead_letter;
DROP INDEX IF EXISTS idx_audit_logs_entity;
DROP INDEX IF EXISTS idx_channels_workspace_deleted;
DROP INDEX IF EXISTS idx_messages_user_created;
DROP INDEX IF EXISTS idx_workspace_members_user_role;
DROP INDEX IF EXISTS idx_channel_members_channel_user;

COMMIT;
