-- Rollback for: 20260704000001_add_dm_presence_categories.sql
-- Generated on: ...

BEGIN;

ALTER TABLE public.channels DROP COLUMN IF EXISTS channel_type;
DROP TABLE IF EXISTS public.dm_channels CASCADE;
DROP INDEX IF EXISTS idx_dm_channels_user1;
DROP INDEX IF EXISTS idx_dm_channels_user2;
DROP INDEX IF EXISTS idx_dm_channels_channel;
DROP TABLE IF EXISTS public.user_presence CASCADE;
DROP TABLE IF EXISTS public.channel_bookmarks CASCADE;
DROP INDEX IF EXISTS idx_channel_bookmarks_channel;
DROP TABLE IF EXISTS public.sidebar_categories CASCADE;
DROP INDEX IF EXISTS idx_sidebar_categories_user_workspace;
DROP TABLE IF EXISTS public.sidebar_channel_assignments CASCADE;
DROP INDEX IF EXISTS idx_sidebar_channel_assignments_category;
DROP TABLE IF EXISTS public.channel_notification_preferences CASCADE;
DROP INDEX IF EXISTS idx_channel_notif_prefs_user;
ALTER TABLE public.dm_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sidebar_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sidebar_channel_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_notification_preferences DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users;
DROP POLICY IF EXISTS "Users;
DROP POLICY IF EXISTS "Anyone;
DROP POLICY IF EXISTS "Users;
DROP POLICY IF EXISTS "Users;
DROP POLICY IF EXISTS "Channel;
DROP POLICY IF EXISTS "Channel;
DROP POLICY IF EXISTS "Bookmark;
DROP POLICY IF EXISTS "Bookmark;
DROP POLICY IF EXISTS "Users;
DROP POLICY IF EXISTS "Users;
DROP POLICY IF EXISTS "Users;

COMMIT;
