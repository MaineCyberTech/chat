-- Clean up workspace/channel membership when a user is deleted
-- This trigger fires on auth.users DELETE and removes all associated rows

CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.user_preferences WHERE user_id = OLD.id;
  DELETE FROM public.user_presence WHERE user_id = OLD.id;
  DELETE FROM public.user_statuses WHERE user_id = OLD.id;
  DELETE FROM public.push_subscriptions WHERE user_id = OLD.id;
  DELETE FROM public.notifications WHERE user_id = OLD.id;
  DELETE FROM public.channel_members WHERE user_id = OLD.id;
  DELETE FROM public.workspace_members WHERE user_id = OLD.id;
  DELETE FROM public.message_reminders WHERE user_id = OLD.id;
  DELETE FROM public.consent_logs WHERE user_id = OLD.id;
  DELETE FROM public.channel_bookmarks WHERE user_id = OLD.id;
  DELETE FROM public.audit_logs WHERE actor_user_id = OLD.id;
  DELETE FROM public.sidebar_categories WHERE user_id = OLD.id;
  DELETE FROM public.sidebar_channel_assignments WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deletion();
