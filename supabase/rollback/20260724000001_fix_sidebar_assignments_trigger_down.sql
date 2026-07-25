DROP FUNCTION IF EXISTS public.handle_user_deletion();

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
  DELETE FROM public.channel_bookmarks WHERE created_by = OLD.id;
  DELETE FROM public.audit_logs WHERE actor_user_id = OLD.id;
  DELETE FROM public.sidebar_categories WHERE user_id = OLD.id;
  DELETE FROM public.sidebar_channel_assignments WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
