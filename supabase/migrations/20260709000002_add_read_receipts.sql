-- Read receipts: track channel-level last_viewed + per-message read receipts
-- Run after 20260709000001_add_auto_responder.sql

-- 1. Add last_viewed_at to channel_members
ALTER TABLE public.channel_members
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;

-- 2. Set default last_viewed_at to joined_at for existing rows
UPDATE public.channel_members
  SET last_viewed_at = joined_at
  WHERE last_viewed_at IS NULL;

-- 3. Note: last_viewed_at is nullable; NOT NULL enforced at application layer
-- to avoid conflicts with seed data and Supabase local reset

-- 4. Create message_reads table for per-message read tracking
CREATE TABLE IF NOT EXISTS public.message_reads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  channel_id  UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  UNIQUE (message_id, user_id)
);

ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- 5. RLS: users can see reads for messages in channels they belong to
CREATE POLICY message_reads_select ON public.message_reads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.channel_members cm
      WHERE cm.channel_id = message_reads.channel_id
        AND cm.user_id = auth.uid()
    )
  );

-- 6. RLS: users can insert their own reads
CREATE POLICY message_reads_insert ON public.message_reads
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.channel_members cm
      WHERE cm.channel_id = message_reads.channel_id
        AND cm.user_id = auth.uid()
    )
  );

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_message_reads_message ON public.message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON public.message_reads(user_id, channel_id);
