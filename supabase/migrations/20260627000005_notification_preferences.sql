-- Notification preferences: per-user mute settings and channel muting

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'all',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, workspace_id, channel_id, notification_type)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences_select_own"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notification_preferences_insert_own"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_preferences_update_own"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user
  ON public.notification_preferences(user_id);

-- Default preferences trigger: auto-create prefs for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id, notification_type, enabled)
  VALUES
    (NEW.id, 'all', true),
    (NEW.id, 'mention', true),
    (NEW.id, 'thread_reply', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
