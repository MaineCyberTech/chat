DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select_own" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
