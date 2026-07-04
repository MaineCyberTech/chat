-- Message features: pinning, flagging, edit history

-- Add is_pinned to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_messages_channel_pinned ON public.messages(channel_id, is_pinned) WHERE is_pinned = true;

-- Create message_flags table for per-user message bookmarking
CREATE TABLE IF NOT EXISTS public.message_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_message_flags_user ON public.message_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_message_flags_message ON public.message_flags(message_id);

-- Enable RLS on message_flags
ALTER TABLE public.message_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own flags"
  ON public.message_flags
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create message_edit_history table
CREATE TABLE IF NOT EXISTS public.message_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  previous_content text NOT NULL,
  edited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edited_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_edit_history_message ON public.message_edit_history(message_id);

-- Enable RLS on message_edit_history
ALTER TABLE public.message_edit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Channel members can view edit history"
  ON public.message_edit_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.channel_members cm ON cm.channel_id = m.channel_id AND cm.user_id = auth.uid()
      WHERE m.id = message_id
    )
  );

CREATE POLICY "Users can insert their own edits"
  ON public.message_edit_history
  FOR INSERT
  WITH CHECK (auth.uid() = edited_by);
