-- DM/GM channel support, user presence, sidebar categories

-- Add channel_type to channels
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS channel_type text NOT NULL DEFAULT 'public' CHECK (channel_type IN ('public', 'private', 'dm', 'group'));

-- Create dm_channels table for tracking DM conversations
CREATE TABLE IF NOT EXISTS public.dm_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  UNIQUE(user2_id, user1_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_channels_user1 ON public.dm_channels(user1_id);
CREATE INDEX IF NOT EXISTS idx_dm_channels_user2 ON public.dm_channels(user2_id);
CREATE INDEX IF NOT EXISTS idx_dm_channels_channel ON public.dm_channels(channel_id);

-- Create user_presence table for status tracking
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'away', 'dnd', 'offline')),
  custom_status text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create channel_bookmarks table
CREATE TABLE IF NOT EXISTS public.channel_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  title text NOT NULL,
  url text,
  emoji text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_channel_bookmarks_channel ON public.channel_bookmarks(channel_id);

-- Create sidebar_categories table
CREATE TABLE IF NOT EXISTS public.sidebar_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_collapsible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_sidebar_categories_user_workspace ON public.sidebar_categories(user_id, workspace_id);

-- Create sidebar_channel_assignments table
CREATE TABLE IF NOT EXISTS public.sidebar_channel_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.sidebar_categories(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_sidebar_channel_assignments_category ON public.sidebar_channel_assignments(category_id);

-- Create notification_preferences table (per-channel overrides)
CREATE TABLE IF NOT EXISTS public.channel_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  notify boolean NOT NULL DEFAULT true,
  notify_sound boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_notif_prefs_user ON public.channel_notification_preferences(user_id);

-- Seed default sidebar categories for existing users
INSERT INTO public.sidebar_categories (user_id, workspace_id, name, sort_order, is_collapsible)
SELECT DISTINCT wm.user_id, wm.workspace_id, 'Channels', 0, false
FROM public.workspace_members wm
WHERE NOT EXISTS (
  SELECT 1 FROM public.sidebar_categories sc
  WHERE sc.user_id = wm.user_id AND sc.workspace_id = wm.workspace_id
);

INSERT INTO public.sidebar_categories (user_id, workspace_id, name, sort_order, is_collapsible)
SELECT DISTINCT wm.user_id, wm.workspace_id, 'Direct Messages', 1, true
FROM public.workspace_members wm
WHERE NOT EXISTS (
  SELECT 1 FROM public.sidebar_categories sc
  WHERE sc.user_id = wm.user_id AND sc.workspace_id = wm.workspace_id AND sc.name = 'Direct Messages'
);

-- Enable RLS on new tables
ALTER TABLE public.dm_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sidebar_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sidebar_channel_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for dm_channels
CREATE POLICY "Users can view their own DMs"
  ON public.dm_channels FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create DMs"
  ON public.dm_channels FOR INSERT
  WITH CHECK (auth.uid() IN (user1_id, user2_id));

-- RLS policies for user_presence
CREATE POLICY "Users can view presence in same workspace"
  ON public.user_presence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm1
      JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = user_presence.user_id
    )
  );

CREATE POLICY "Users can update their own presence"
  ON public.user_presence FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own presence"
  ON public.user_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for channel_bookmarks
CREATE POLICY "Channel members can view bookmarks"
  ON public.channel_bookmarks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.channel_members cm
      WHERE cm.channel_id = channel_bookmarks.channel_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Channel members can create bookmarks"
  ON public.channel_bookmarks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.channel_members cm
      WHERE cm.channel_id = channel_bookmarks.channel_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Bookmark creators can update"
  ON public.channel_bookmarks FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Bookmark creators can delete"
  ON public.channel_bookmarks FOR DELETE
  USING (auth.uid() = created_by);

-- RLS policies for sidebar_categories
CREATE POLICY "Users manage their own categories"
  ON public.sidebar_categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for sidebar_channel_assignments
CREATE POLICY "Users manage their own category assignments"
  ON public.sidebar_channel_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sidebar_categories sc
      WHERE sc.id = sidebar_channel_assignments.category_id AND sc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sidebar_categories sc
      WHERE sc.id = sidebar_channel_assignments.category_id AND sc.user_id = auth.uid()
    )
  );

-- RLS policies for channel_notification_preferences
CREATE POLICY "Users manage their own notification prefs"
  ON public.channel_notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
