CREATE INDEX IF NOT EXISTS idx_channel_notif_prefs_channel_user
  ON public.channel_notification_preferences (channel_id, user_id);

COMMENT ON INDEX idx_channel_notif_prefs_channel_user IS 'Speeds up per-channel notification preference lookups by channel + user';
