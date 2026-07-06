-- Rollback for: 20260625000007_add_missing_indexes.sql
-- Generated on: ...

BEGIN;

DROP INDEX IF EXISTS idx_workspace_members_user_id;
DROP INDEX IF EXISTS idx_channel_members_user_id;
DROP INDEX IF EXISTS idx_messages_parent_id;

COMMIT;
