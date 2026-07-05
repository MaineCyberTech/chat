CREATE TABLE IF NOT EXISTS public.user_groups (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text DEFAULT '',
  created_by   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, name)
);

CREATE TABLE IF NOT EXISTS public.user_group_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  uuid NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groups are visible to workspace members"
  ON public.user_groups
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = user_groups.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Users create and manage their own groups"
  ON public.user_groups
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creators can update their groups"
  ON public.user_groups
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creators can delete their groups"
  ON public.user_groups
  FOR DELETE
  USING (created_by = auth.uid());

CREATE POLICY "Group members visible to workspace members"
  ON public.user_group_members
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_groups ug JOIN workspace_members wm ON wm.workspace_id = ug.workspace_id AND wm.user_id = auth.uid()
    WHERE ug.id = user_group_members.group_id
  ));

CREATE POLICY "Group creators manage members"
  ON public.user_group_members
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_groups ug WHERE ug.id = user_group_members.group_id AND ug.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_groups ug WHERE ug.id = user_group_members.group_id AND ug.created_by = auth.uid()
  ));
