-- User groups for @groupname mentions
CREATE TABLE IF NOT EXISTS public.user_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, name)
);

CREATE TABLE IF NOT EXISTS public.user_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_groups_workspace ON public.user_groups(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_group_members_group ON public.user_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_user_group_members_user ON public.user_group_members(user_id);

ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view groups"
  ON public.user_groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = user_groups.workspace_id AND wm.user_id = auth.uid()));

CREATE POLICY "Admins can manage groups"
  ON public.user_groups FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = user_groups.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('admin', 'owner')));

CREATE POLICY "Admins can update groups"
  ON public.user_groups FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = user_groups.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('admin', 'owner')));

CREATE POLICY "Admins can delete groups"
  ON public.user_groups FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = user_groups.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('admin', 'owner')));

CREATE POLICY "Group members can view member list"
  ON public.user_group_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_groups ug JOIN public.workspace_members wm ON wm.workspace_id = ug.workspace_id WHERE ug.id = user_group_members.group_id AND wm.user_id = auth.uid()));

CREATE POLICY "Admins can manage group members"
  ON public.user_group_members FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_groups ug JOIN public.workspace_members wm ON wm.workspace_id = ug.workspace_id WHERE ug.id = user_group_members.group_id AND wm.user_id = auth.uid() AND wm.role IN ('admin', 'owner')));
