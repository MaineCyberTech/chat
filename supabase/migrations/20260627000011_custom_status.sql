-- Custom user status support

CREATE TABLE IF NOT EXISTS public.user_statuses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  emoji       TEXT NOT NULL DEFAULT 'speech_balloon',
  text        TEXT NOT NULL DEFAULT '',
  expires_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_statuses_select"
  ON public.user_statuses FOR SELECT
  USING (true);

CREATE POLICY "user_statuses_upsert_own"
  ON public.user_statuses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_statuses_update_own"
  ON public.user_statuses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "user_statuses_delete_own"
  ON public.user_statuses FOR DELETE
  USING (auth.uid() = user_id);
