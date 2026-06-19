-- users_rls.sql
-- Row-Level Security policies for the users table.
-- Run after 001_users.sql.

-- Users can view any profile (needed for displaying names/avatars in chat)
CREATE POLICY "Users are viewable by authenticated users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Users can insert only their own profile (handled by trigger, but belt-and-suspenders)
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));
