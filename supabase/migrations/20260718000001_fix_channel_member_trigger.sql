-- Fix handle_new_channel() trigger to include last_viewed_at
-- The last_viewed_at column is NOT NULL on hosted Supabase, so the trigger
-- must provide a value when auto-adding the channel creator as a member.

CREATE OR REPLACE FUNCTION public.handle_new_channel()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.channel_members (channel_id, user_id, last_viewed_at)
  VALUES (NEW.id, NEW.created_by, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
