-- Rollback for: 20260625000018_workspace_member_unique_owner.sql
-- Generated on: ...

BEGIN;

DROP INDEX IF EXISTS idx_workspace_members_unique_owner;

COMMIT;
