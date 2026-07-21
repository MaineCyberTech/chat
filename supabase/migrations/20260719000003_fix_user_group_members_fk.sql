-- Fix user_group_members.user_id FK: auth.users → public.users
-- Without this, PostgREST cannot resolve the users!inner join hint
-- because the FK points to auth.users (not exposed by PostgREST) instead of public.users.
-- This caused GET /v1/groups/:id/members to return 500.

-- Drop the existing FK to auth.users
ALTER TABLE public.user_group_members
  DROP CONSTRAINT IF EXISTS user_group_members_user_id_fkey;

-- Re-add FK pointing to public.users (which itself refs auth.users)
ALTER TABLE public.user_group_members
  ADD CONSTRAINT user_group_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
