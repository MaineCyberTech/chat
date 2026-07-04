-- Add read-only flag to channels
ALTER TABLE public.channels
  ADD COLUMN IF NOT EXISTS is_read_only BOOLEAN NOT NULL DEFAULT false;

-- Read-only check function for message insert trigger
CREATE OR REPLACE FUNCTION public.prevent_read_only_message()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.channels
    WHERE id = NEW.channel_id AND is_read_only = true
  ) THEN
    RAISE EXCEPTION 'Channel is read-only'
      USING HINT = 'Only admins can post in read-only channels';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS check_read_only_on_insert ON public.messages;
CREATE TRIGGER check_read_only_on_insert
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_read_only_message();
