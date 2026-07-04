-- Group messaging (GM) support — replaces rigid 2-user dm_channels with flexible dm_members

-- Create dm_members table (supports 2-user DMs and N-user GMs)
CREATE TABLE IF NOT EXISTS public.dm_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_members_channel ON public.dm_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_dm_members_user ON public.dm_members(user_id);

-- Enable RLS
ALTER TABLE public.dm_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own DM memberships"
  ON public.dm_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.channel_members cm
      WHERE cm.channel_id = dm_members.channel_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join DMs they're part of"
  ON public.dm_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.channel_members cm
      WHERE cm.channel_id = dm_members.channel_id AND cm.user_id = auth.uid()
    )
  );

-- Migrate existing dm_channels data into dm_members
INSERT INTO public.dm_members (channel_id, user_id)
SELECT channel_id, user1_id FROM public.dm_channels
ON CONFLICT DO NOTHING;

INSERT INTO public.dm_members (channel_id, user_id)
SELECT channel_id, user2_id FROM public.dm_channels
ON CONFLICT DO NOTHING;
