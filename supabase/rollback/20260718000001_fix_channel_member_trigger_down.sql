
-- Revert: restore original handle_new_channel() without last_viewed_at
CREATE OR REPLACE FUNCTION public.handle_new_channel()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.channel_members (channel_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = "public";
