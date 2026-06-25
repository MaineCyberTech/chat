-- Backfill existing auth.users into public.users
-- Run after 020_auto_create_user_profile.sql

INSERT INTO public.users (id, email, display_name, avatar_url, created_at, updated_at)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'display_name',
  au.raw_user_meta_data->>'avatar_url',
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;
