-- Fix trigger to use COALESCE for display_name (Management API users have no raw_user_meta_data)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.notification_preferences (user_id, notification_type, enabled)
  VALUES
    (NEW.id, 'all', true),
    (NEW.id, 'mention', true),
    (NEW.id, 'thread_reply', true)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Backfill display_name for users where it was set to NULL by the old trigger
UPDATE public.users
SET display_name = split_part(email, '@', 1)
WHERE display_name IS NULL AND email IS NOT NULL;
