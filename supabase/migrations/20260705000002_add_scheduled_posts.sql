CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id   uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  content      text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  sent_at      timestamptz,
  cancelled_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT future_schedule CHECK (scheduled_at > created_at)
);

CREATE INDEX idx_scheduled_posts_due ON public.scheduled_posts (scheduled_at)
  WHERE sent_at IS NULL AND cancelled_at IS NULL;

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own scheduled posts"
  ON public.scheduled_posts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
