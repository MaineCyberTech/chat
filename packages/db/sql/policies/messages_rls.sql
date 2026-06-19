-- messages_rls.sql
-- RLS policies for messages.

-- Workspace members can view messages in channels they belong to
CREATE POLICY "Workspace members can view messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.channels ch
      JOIN public.workspace_members wm ON wm.workspace_id = ch.workspace_id
      WHERE ch.id = messages.channel_id
        AND wm.user_id = (SELECT auth.uid())
    )
  );

-- Workspace members can insert messages
CREATE POLICY "Workspace members can insert messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.channels ch
      JOIN public.workspace_members wm ON wm.workspace_id = ch.workspace_id
      WHERE ch.id = messages.channel_id
        AND wm.user_id = (SELECT auth.uid())
    )
  );

-- Authors can update their own messages
CREATE POLICY "Authors can update own messages"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Authors can delete their own messages
CREATE POLICY "Authors can delete own messages"
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
