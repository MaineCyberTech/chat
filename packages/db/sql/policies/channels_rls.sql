-- channels_rls.sql
-- RLS policies for channels and channel_members.

-- Members can view public channels in their workspaces
CREATE POLICY "Members can view channels in their workspaces"
  ON public.channels
  FOR SELECT
  TO authenticated
  USING (
    is_private = false
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = channels.workspace_id
        AND user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.channel_members
      WHERE channel_id = channels.id
        AND user_id = (SELECT auth.uid())
    )
  );

-- Workspace members can create channels
CREATE POLICY "Workspace members can create channels"
  ON public.channels
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = channels.workspace_id
        AND user_id = (SELECT auth.uid())
    )
    AND created_by = (SELECT auth.uid())
  );

-- Channel creators can update their channels
CREATE POLICY "Channel creator can update"
  ON public.channels
  FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (true);

-- Channel creators can delete their channels
CREATE POLICY "Channel creator can delete"
  ON public.channels
  FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- Membership policies
CREATE POLICY "Workspace members can view channel members"
  ON public.channel_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = (
        SELECT workspace_id FROM public.channels WHERE id = channel_members.channel_id
      )
      AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Workspace members can join channels"
  ON public.channel_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = (
        SELECT workspace_id FROM public.channels WHERE id = channel_id
      )
      AND user_id = (SELECT auth.uid())
    )
  );
