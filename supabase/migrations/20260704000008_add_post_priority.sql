-- Add post priority column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'standard'
  CHECK (priority IN ('standard', 'important', 'urgent', 'critical'));

-- Update RLS to allow insert with priority
DROP POLICY IF EXISTS "channel_member_insert" ON public.messages;
CREATE POLICY "channel_member_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.channel_members cm
      WHERE cm.channel_id = messages.channel_id AND cm.user_id = auth.uid()
    )
  );
