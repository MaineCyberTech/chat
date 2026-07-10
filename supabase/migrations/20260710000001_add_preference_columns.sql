ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS clock_format TEXT DEFAULT '12h',
  ADD COLUMN IF NOT EXISTS message_display TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS sidebar_show_display_name BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sidebar_sort_alphabetical BOOLEAN DEFAULT false;
