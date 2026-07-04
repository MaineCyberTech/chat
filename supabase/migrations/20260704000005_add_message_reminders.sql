-- Message reminders for "remind me later" feature
CREATE TABLE IF NOT EXISTS public.message_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  remind_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  notified boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_message_reminders_due ON public.message_reminders(remind_at) WHERE notified = false;
CREATE INDEX IF NOT EXISTS idx_message_reminders_user ON public.message_reminders(user_id);

ALTER TABLE public.message_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own reminders"
  ON public.message_reminders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
