-- Thread metadata and participant tracking
-- Run after messages table is set up (004_messages.sql)

-- Thread metadata: tracks reply count, participant count, last activity per thread
CREATE TABLE IF NOT EXISTS public.thread_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE UNIQUE,
  reply_count INT NOT NULL DEFAULT 0,
  participant_count INT NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Thread participants: tracks who has joined/participated in a thread
CREATE TABLE IF NOT EXISTS public.thread_participants (
  thread_id UUID NOT NULL REFERENCES public.thread_metadata(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

ALTER TABLE public.thread_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;

-- RLS: workspace members can see thread metadata for messages in their channels
CREATE POLICY "thread_metadata_select_workspace_member"
  ON public.thread_metadata FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.channels ch ON ch.id = m.channel_id
      JOIN public.workspace_members wm ON wm.workspace_id = ch.workspace_id
      WHERE m.id = thread_metadata.message_id AND wm.user_id = auth.uid()
    )
  );

-- RLS: users can see thread participants for threads they can access
CREATE POLICY "thread_participants_select"
  ON public.thread_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_metadata tm
      JOIN public.messages m ON m.id = tm.message_id
      JOIN public.channels ch ON ch.id = m.channel_id
      JOIN public.workspace_members wm ON wm.workspace_id = ch.workspace_id
      WHERE tm.id = thread_participants.thread_id AND wm.user_id = auth.uid()
    )
  );

-- RLS: users can insert their own thread participation
CREATE POLICY "thread_participants_insert_own"
  ON public.thread_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_thread_metadata_last_activity
  ON public.thread_metadata(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_thread_participants_user
  ON public.thread_participants(user_id);

-- Trigger: auto-create thread_metadata when a reply (message with parent_id) is inserted
CREATE OR REPLACE FUNCTION public.handle_thread_reply()
RETURNS TRIGGER AS $$
DECLARE
  thread_id UUID;
BEGIN
  -- Upsert thread_metadata for the parent message
  INSERT INTO public.thread_metadata (message_id, reply_count, participant_count, last_activity_at)
  VALUES (NEW.parent_id, 1, 1, NEW.created_at)
  ON CONFLICT (message_id) DO UPDATE SET
    reply_count = thread_metadata.reply_count + 1,
    last_activity_at = GREATEST(thread_metadata.last_activity_at, NEW.created_at)
  RETURNING id INTO thread_id;

  -- Add replier as thread participant
  INSERT INTO public.thread_participants (thread_id, user_id)
  VALUES (thread_id, NEW.user_id)
  ON CONFLICT (thread_id, user_id) DO UPDATE SET
    last_read_at = NEW.created_at;

  -- Also add parent message author as participant
  INSERT INTO public.thread_participants (thread_id, user_id)
  SELECT thread_id, m.user_id FROM public.messages m WHERE m.id = NEW.parent_id
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS on_message_reply ON public.messages;
CREATE TRIGGER on_message_reply
  AFTER INSERT ON public.messages
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION public.handle_thread_reply();
