-- Channel-level role overrides for granular access control
-- Precedence: explicit deny > explicit allow > workspace role default

CREATE TABLE IF NOT EXISTS public.channel_role_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'moderator', 'member', 'guest')),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('allow', 'deny')),
  scope TEXT NOT NULL DEFAULT 'read' CHECK (scope IN ('read', 'write', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT one_target CHECK (
    (role IS NOT NULL AND user_id IS NULL) OR
    (role IS NULL AND user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_channel_role_overrides_channel
  ON public.channel_role_overrides(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_role_overrides_user
  ON public.channel_role_overrides(user_id);

ALTER TABLE public.channel_role_overrides ENABLE ROW LEVEL SECURITY;

-- Admins can manage overrides
CREATE POLICY "channel_role_overrides_manage_admin"
  ON public.channel_role_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.channels ch
      JOIN public.workspace_members wm ON wm.workspace_id = ch.workspace_id
      WHERE ch.id = channel_role_overrides.channel_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- Everyone else can read overrides
CREATE POLICY "channel_role_overrides_select_member"
  ON public.channel_role_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.channels ch
      JOIN public.workspace_members wm ON wm.workspace_id = ch.workspace_id
      WHERE ch.id = channel_role_overrides.channel_id
        AND wm.user_id = auth.uid()
    )
  );

-- Update channel RLS to respect overrides for hidden channels
-- Replace the existing channels_select_member policy
DROP POLICY IF EXISTS channels_select_member ON public.channels;
CREATE POLICY channels_select_member ON public.channels FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = channels.workspace_id
        AND wm.user_id = auth.uid()
    )
    AND NOT EXISTS (
      -- Exclude channels where user has an explicit deny override
      SELECT 1 FROM public.channel_role_overrides cro
      WHERE cro.channel_id = channels.id
        AND cro.user_id = auth.uid()
        AND cro.permission = 'deny'
        AND cro.scope = 'read'
    )
  );

-- Also update message visibility to respect channel overrides
DROP POLICY IF EXISTS messages_select_member ON public.messages;
CREATE POLICY messages_select_member ON public.messages FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.channels ch
      JOIN public.workspace_members wm ON wm.workspace_id = ch.workspace_id AND wm.user_id = auth.uid()
      WHERE ch.id = messages.channel_id
        AND ch.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.channel_role_overrides cro
          WHERE cro.channel_id = ch.id
            AND cro.user_id = auth.uid()
            AND cro.permission = 'deny'
            AND cro.scope = 'read'
        )
    )
  );
