CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.dm_members WHERE user_id = OLD.id;
  DELETE FROM public.notification_preferences WHERE user_id = OLD.id;
  DELETE FROM public.custom_emoji WHERE created_by = OLD.id;
  DELETE FROM public.user_group_members WHERE user_id = OLD.id;
  DELETE FROM public.user_groups WHERE created_by = OLD.id;
  DELETE FROM public.thread_participants WHERE user_id = OLD.id;
  DELETE FROM public.channel_role_overrides WHERE user_id = OLD.id;
  DELETE FROM public.message_reads WHERE user_id = OLD.id;
  DELETE FROM public.channel_member_history WHERE user_id = OLD.id;
  DELETE FROM public.compliance_exports WHERE created_by = OLD.id;
  DELETE FROM public.webhook_endpoints WHERE created_by = OLD.id;
  DELETE FROM public.channel_notification_preferences WHERE user_id = OLD.id;
  DELETE FROM public.message_flags WHERE user_id = OLD.id;
  DELETE FROM public.message_edit_history WHERE edited_by = OLD.id;
  DELETE FROM public.reactions WHERE user_id = OLD.id;
  DELETE FROM public.messages WHERE user_id = OLD.id;
  DELETE FROM public.dm_channels WHERE user1_id = OLD.id OR user2_id = OLD.id;
  DELETE FROM public.scheduled_posts WHERE user_id = OLD.id;
  DELETE FROM public.trigger_words WHERE user_id = OLD.id;
  DELETE FROM public.auto_responders WHERE user_id = OLD.id;
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
  DELETE FROM public.sidebar_channel_assignments WHERE category_id IN (SELECT id FROM public.sidebar_categories WHERE user_id = OLD.id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
