-- Rollback for: 20260704000001_add_dm_presence_categories.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "Users manage their own notification prefs" ON public.channel_notification_preferences;
DROP POLICY IF EXISTS "Users manage their own category assignments" ON public.sidebar_channel_assignments;
DROP POLICY IF EXISTS "Users manage their own categories" ON public.sidebar_categories;
DROP POLICY IF EXISTS "Bookmark creators can delete" ON public.channel_bookmarks;
DROP POLICY IF EXISTS "Bookmark creators can update" ON public.channel_bookmarks;
DROP POLICY IF EXISTS "Channel members can create bookmarks" ON public.channel_bookmarks;
DROP POLICY IF EXISTS "Channel members can view bookmarks" ON public.channel_bookmarks;
DROP POLICY IF EXISTS "Users can insert their own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can view presence in same workspace" ON public.user_presence;
DROP POLICY IF EXISTS "Users can create DMs" ON public.dm_channels;
DROP POLICY IF EXISTS "Users can view their own DMs" ON public.dm_channels;
ALTER TABLE IF EXISTS public.channel_notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sidebar_channel_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sidebar_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.channel_bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_presence DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dm_channels DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_channel_notif_prefs_user;
DROP TABLE IF EXISTS public.channel_notification_preferences CASCADE;
DROP INDEX IF EXISTS idx_sidebar_channel_assignments_category;
DROP TABLE IF EXISTS public.sidebar_channel_assignments CASCADE;
DROP INDEX IF EXISTS idx_sidebar_categories_user_workspace;
DROP TABLE IF EXISTS public.sidebar_categories CASCADE;
DROP INDEX IF EXISTS idx_channel_bookmarks_channel;
DROP TABLE IF EXISTS public.channel_bookmarks CASCADE;
DROP TABLE IF EXISTS public.user_presence CASCADE;
DROP INDEX IF EXISTS idx_dm_channels_channel;
DROP INDEX IF EXISTS idx_dm_channels_user2;
DROP INDEX IF EXISTS idx_dm_channels_user1;
DROP TABLE IF EXISTS public.dm_channels CASCADE;
ALTER TABLE IF EXISTS public.channels DROP COLUMN IF EXISTS channel_type;

COMMIT;
