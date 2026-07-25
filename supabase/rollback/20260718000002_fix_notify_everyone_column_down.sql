DROP INDEX IF EXISTS idx_channel_notif_prefs_everyone;
ALTER TABLE public.channel_notification_preferences DROP COLUMN IF EXISTS notify_everyone;
