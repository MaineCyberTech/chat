-- Rollback for: 20260626000024_add_channels_insert_policy.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "channels_insert_member";

COMMIT;
