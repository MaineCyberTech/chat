-- Rollback for: 20260627000006_channel_role_overrides.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS messages_select_member ON public.messages;
DROP POLICY IF EXISTS channels_select_member ON public.channels;
DROP POLICY IF EXISTS "channel_role_overrides_select_member" ON public.channel_role_overrides;
DROP FUNCTION IF EXISTS public.channel_workspace CASCADE;
DROP POLICY IF EXISTS "channel_role_overrides_manage_admin" ON public.channel_role_overrides;
ALTER TABLE IF EXISTS public.channel_role_overrides DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_channel_role_overrides_user;
DROP INDEX IF EXISTS idx_channel_role_overrides_channel;
DROP TABLE IF EXISTS public.channel_role_overrides CASCADE;

COMMIT;
