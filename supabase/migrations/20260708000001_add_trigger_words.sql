-- Trigger words for user notifications

CREATE TABLE IF NOT EXISTS public.trigger_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, word)
);

ALTER TABLE public.trigger_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own trigger words"
  ON public.trigger_words
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_trigger_words_user_id ON public.trigger_words (user_id);
