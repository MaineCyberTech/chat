ALTER TABLE public.channel_notification_preferences
  ADD COLUMN notify_everyone boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_channel_notif_prefs_everyone
  ON public.channel_notification_preferences(notify_everyone)
  WHERE notify_everyone = false;
