-- Rollback for: 20260625000003_create_channels.sql
-- Generated on: ...

BEGIN;

DROP TRIGGER IF EXISTS channels_updated_at ON public.channels;
DROP TRIGGER IF EXISTS on_channel_created ON public.channels;
DROP FUNCTION IF EXISTS public.handle_new_channel CASCADE;
ALTER TABLE IF EXISTS public.channel_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.channels DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.channel_members CASCADE;
DROP TABLE IF EXISTS public.channels CASCADE;

COMMIT;
