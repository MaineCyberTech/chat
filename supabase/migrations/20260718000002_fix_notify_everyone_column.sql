-- Fix: add notify_everyone column if missing on hosted Supabase
-- Original migration 20260707000003 was tracked but column may not exist

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'channel_notification_preferences'
      AND column_name = 'notify_everyone'
  ) THEN
    ALTER TABLE public.channel_notification_preferences
      ADD COLUMN notify_everyone boolean NOT NULL DEFAULT true;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_channel_notif_prefs_everyone
  ON public.channel_notification_preferences(notify_everyone)
  WHERE notify_everyone = false;
