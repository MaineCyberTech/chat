-- Simplify RLS policies to remove circular dependency between channels and channel_role_overrides
-- channels_select_member queries channel_role_overrides
-- channel_role_overrides_select_member queries channels -> infinite recursion
-- Fix: Remove channel_role_overrides check from channels_select_member (handled at app level)

-- Drop the recursive channel_role_overrides SELECT policy (redundant — users can read
-- overrides implicitly through the channels they can access)
DROP POLICY IF EXISTS "channel_role_overrides_select_member" ON public.channel_role_overrides;

-- Simplify channels_select_member to not reference channel_role_overrides
DROP POLICY IF EXISTS channels_select_member ON public.channels;
CREATE POLICY channels_select_member ON public.channels FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = channels.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- Simplify messages_select_member similarly (remove channel_role_overrides check)
DROP POLICY IF EXISTS messages_select_member ON public.messages;
CREATE POLICY messages_select_member ON public.messages FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.channels ch
      JOIN public.workspace_members wm ON wm.workspace_id = ch.workspace_id AND wm.user_id = auth.uid()
      WHERE ch.id = messages.channel_id
        AND ch.deleted_at IS NULL
    )
  );
