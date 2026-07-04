-- Custom emoji for workspace-specific emoji reactions
CREATE TABLE IF NOT EXISTS public.custom_emoji (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_custom_emoji_workspace ON public.custom_emoji(workspace_id);

ALTER TABLE public.custom_emoji ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view custom emoji"
  ON public.custom_emoji FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = custom_emoji.workspace_id AND wm.user_id = auth.uid())
  );

CREATE POLICY "Admins can manage custom emoji"
  ON public.custom_emoji FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = custom_emoji.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('admin', 'owner'))
  );

CREATE POLICY "Admins can delete custom emoji"
  ON public.custom_emoji FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = custom_emoji.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('admin', 'owner'))
  );
