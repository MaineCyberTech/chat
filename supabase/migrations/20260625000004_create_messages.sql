-- 004_messages.sql
-- Messages within channels.
-- Run after 003_channels.sql.

CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id  UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  parent_id   UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  edited_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_channel_created
  ON public.messages (channel_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
