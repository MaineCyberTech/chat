CREATE OR REPLACE FUNCTION public.gdpr_delete_user(target_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, auth'
AS $$
DECLARE
  result jsonb;
BEGIN
  DELETE FROM dm_members WHERE user_id = target_user_id;
  DELETE FROM notification_preferences WHERE user_id = target_user_id;
  DELETE FROM custom_emoji WHERE created_by = target_user_id;
  DELETE FROM user_group_members WHERE user_id = target_user_id;
  DELETE FROM user_groups WHERE created_by = target_user_id;
  DELETE FROM thread_participants WHERE user_id = target_user_id;
  DELETE FROM channel_role_overrides WHERE user_id = target_user_id;
  DELETE FROM message_reads WHERE user_id = target_user_id;
  DELETE FROM channel_member_history WHERE user_id = target_user_id;
  DELETE FROM compliance_exports WHERE created_by = target_user_id;

  DELETE FROM sidebar_channel_assignments
  WHERE category_id IN (SELECT id FROM sidebar_categories WHERE user_id = target_user_id);

  DELETE FROM sidebar_categories WHERE user_id = target_user_id;
  DELETE FROM channel_notification_preferences WHERE user_id = target_user_id;
  DELETE FROM consent_logs WHERE user_id = target_user_id;
  DELETE FROM channel_bookmarks WHERE created_by = target_user_id;
  DELETE FROM message_reminders WHERE user_id = target_user_id;
  DELETE FROM notifications WHERE user_id = target_user_id;
  DELETE FROM push_subscriptions WHERE user_id = target_user_id;
  DELETE FROM message_edit_history WHERE edited_by = target_user_id;
  DELETE FROM scheduled_posts WHERE user_id = target_user_id;
  DELETE FROM trigger_words WHERE user_id = target_user_id;
  DELETE FROM auto_responders WHERE user_id = target_user_id;
  DELETE FROM user_statuses WHERE user_id = target_user_id;
  DELETE FROM user_presence WHERE user_id = target_user_id;
  DELETE FROM message_flags WHERE user_id = target_user_id;
  DELETE FROM reactions WHERE user_id = target_user_id;
  DELETE FROM messages WHERE user_id = target_user_id;
  DELETE FROM dm_channels WHERE user1_id = target_user_id OR user2_id = target_user_id;
  DELETE FROM webhook_endpoints WHERE created_by = target_user_id;
  DELETE FROM channel_members WHERE user_id = target_user_id;
  DELETE FROM workspace_members WHERE user_id = target_user_id;
  DELETE FROM audit_logs WHERE actor_user_id = target_user_id;
  DELETE FROM user_preferences WHERE user_id = target_user_id;
  DELETE FROM users WHERE id = target_user_id;

  result := jsonb_build_object('success', true, 'user_id', target_user_id);
  RETURN result;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'gdpr_delete_user failed for %: %', target_user_id, SQLERRM;
    result := jsonb_build_object(
      'success', false,
      'user_id', target_user_id,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;
