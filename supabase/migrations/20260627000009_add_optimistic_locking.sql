-- Add optimistic locking version columns to messages and channels
-- Prevents lost updates from concurrent edits

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.channels
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Helper function to increment version atomically
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment version on update
DROP TRIGGER IF EXISTS messages_version ON public.messages;
CREATE TRIGGER messages_version
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS channels_version ON public.channels;
CREATE TRIGGER channels_version
  BEFORE UPDATE ON public.channels
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_version();
