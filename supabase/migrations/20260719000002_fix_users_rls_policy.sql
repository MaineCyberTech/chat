-- Fix users RLS: allow all authenticated users to see user profiles
-- The old policy (auth.uid() = id) prevented the users!inner JOIN from
-- returning other members' profiles. Since users table only contains
-- display_name and avatar_url (non-sensitive), allow all authenticated SELECT.

DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select" ON public.users;

CREATE POLICY "users_select" ON public.users
  FOR SELECT TO authenticated
  USING (true);
