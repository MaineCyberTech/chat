ALTER TABLE public.user_preferences
  DROP COLUMN IF EXISTS clock_format,
  DROP COLUMN IF EXISTS message_display,
  DROP COLUMN IF EXISTS sidebar_show_display_name,
  DROP COLUMN IF EXISTS sidebar_sort_alphabetical;
