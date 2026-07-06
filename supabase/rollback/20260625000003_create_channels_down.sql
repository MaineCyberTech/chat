-- Rollback for: 20260625000003_create_channels.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.channels CASCADE;
DROP TABLE IF EXISTS public.channel_members CASCADE;
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members DISABLE ROW LEVEL SECURITY;
DROP FUNCTION IF EXISTS public.handle_new_channel();
DROP TRIGGER IF EXISTS on_channel_created;
DROP TRIGGER IF EXISTS channels_updated_at;
-- Manual rollback needed: UPDATE on ON

COMMIT;
