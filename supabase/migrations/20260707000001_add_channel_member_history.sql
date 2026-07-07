-- Track channel member join/leave events for audit and analytics
CREATE TABLE IF NOT EXISTS public.channel_member_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event      TEXT NOT NULL CHECK (event IN ('joined', 'removed', 'left')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.channel_member_history ENABLE ROW LEVEL SECURITY;

-- Allow workspace members to view history for channels they can access
CREATE POLICY "channel_member_history_select"
  ON public.channel_member_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.channel_members cm
      WHERE cm.channel_id = channel_member_history.channel_id
        AND cm.user_id = auth.uid()
    )
  );

-- Allow the trigger function to insert (via SECURITY DEFINER)
CREATE POLICY "channel_member_history_insert"
  ON public.channel_member_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger: log member joined
CREATE OR REPLACE FUNCTION public.log_channel_member_join()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.channel_member_history (channel_id, user_id, event)
  VALUES (NEW.channel_id, NEW.user_id, 'joined');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS on_channel_member_joined ON public.channel_members;
CREATE TRIGGER on_channel_member_joined
  AFTER INSERT ON public.channel_members
  FOR EACH ROW
  EXECUTE FUNCTION public.log_channel_member_join();

-- Index for fast member history queries
CREATE INDEX IF NOT EXISTS idx_channel_member_history_channel
  ON public.channel_member_history (channel_id, created_at DESC);

COMMENT ON TABLE public.channel_member_history IS 'Audit log of channel member join/leave events';
COMMENT ON INDEX idx_channel_member_history_channel IS 'Speeds up member history listing per channel';
