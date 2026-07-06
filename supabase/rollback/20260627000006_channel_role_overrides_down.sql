-- Rollback for: 20260627000006_channel_role_overrides.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.channel_role_overrides CASCADE;
DROP INDEX IF EXISTS idx_channel_role_overrides_channel;
DROP INDEX IF EXISTS idx_channel_role_overrides_user;
ALTER TABLE public.channel_role_overrides DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "channel_role_overrides_manage_admin";
DROP FUNCTION IF EXISTS public.channel_workspace(channel_id;
DROP POLICY IF EXISTS "channel_role_overrides_select_member";
DROP POLICY IF EXISTS channels_select_member;
DROP POLICY IF EXISTS messages_select_member;

COMMIT;
