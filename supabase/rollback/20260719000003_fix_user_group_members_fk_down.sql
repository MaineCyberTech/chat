ALTER TABLE public.user_group_members DROP CONSTRAINT IF EXISTS user_group_members_user_id_fkey;
ALTER TABLE public.user_group_members ADD CONSTRAINT user_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
