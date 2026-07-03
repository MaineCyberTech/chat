-- Fix circular RLS policy recursion between channels and channel_role_overrides
-- channels_select_member queries channel_role_overrides
-- channel_role_overrides_select_member queries channels -> infinite recursion

-- Helper: get workspace_id for a channel (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.channel_workspace(channel_id UUID)
RETURNS UUID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT workspace_id FROM public.channels WHERE id = channel_id;
$$;

-- Recreate the channel_role_overrides SELECT policy to avoid circular dependency
DROP POLICY IF EXISTS "channel_role_overrides_select_member" ON public.channel_role_overrides;
CREATE POLICY "channel_role_overrides_select_member"
  ON public.channel_role_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = public.channel_workspace(channel_role_overrides.channel_id)
        AND wm.user_id = auth.uid()
    )
  );
