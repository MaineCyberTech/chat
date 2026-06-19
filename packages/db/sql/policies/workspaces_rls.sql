-- workspaces_rls.sql
-- RLS policies for workspaces and workspace_members.

-- Users can view workspaces they belong to
CREATE POLICY "Workspaces are viewable by members"
  ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = id AND user_id = (SELECT auth.uid())
    )
  );

-- Workspace owners/admins can update
CREATE POLICY "Workspace owners and admins can update"
  ON public.workspaces
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = id
        AND user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (true);

-- Workspace owners can delete
CREATE POLICY "Workspace owners can delete"
  ON public.workspaces
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = id
        AND user_id = (SELECT auth.uid())
        AND role = 'owner'
    )
  );

-- Authenticated users can create workspaces (they become owner via trigger)
CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- Membership policies
CREATE POLICY "Members can view workspace membership"
  ON public.workspace_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm2
      WHERE wm2.workspace_id = workspace_id AND wm2.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners and admins can manage members"
  ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm2
      WHERE wm2.workspace_id = workspace_id
        AND wm2.user_id = (SELECT auth.uid())
        AND wm2.role IN ('owner', 'admin')
    )
  );
