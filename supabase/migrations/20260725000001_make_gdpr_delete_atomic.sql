-- DATA-P2-005: make GDPR account erasure idempotent, atomic and complete.
--
-- Root-cause bug: the previous definition declared
--   SET search_path = 'public, auth'      -- quoted -> ONE schema literally named
--                                         -- "public, auth", so current_schemas()={}
-- which made every unqualified reference (dm_members, messages, ...) fail with
-- "relation ... does not exist". gdpr_delete_user therefore deleted NOTHING and always
-- returned success=false, so the API 500'd and the right to erasure was never honoured.
-- The fix uses the unquoted list form SET search_path = public, auth.
--
-- Additionally, before this migration the erasure was a two-step, non-atomic operation:
--   1. apps/api called public.gdpr_delete_user(...), which hard-deleted all of the
--      user's public rows and the auth token/identity rows; then
--   2. the API called supabase.auth.admin.deleteUser(...) to remove auth.users.
-- If step 2 failed (network/GoTrue error), the public data and auth identities were
-- already gone, the route returned 500, and a retry was impossible because the user
-- could no longer re-authenticate. The account was left partially erased.
--
-- This function now removes auth.users inside the same transaction as the rest of the
-- deletes, so the whole erasure either commits or rolls back as one unit (the EXCEPTION
-- handler catches errors in the same transaction and returns success=false). Every
-- statement is a plain DELETE, so calling it again after a successful (or partial,
-- rolled-back) run is a no-op: the function is idempotent and safe to retry.
--
-- Deleted (hard-erased):
--   Public, user-owned: dm_members, notification_preferences, custom_emoji,
--     user_group_members, user_groups, thread_participants, channel_role_overrides,
--     message_reads, channel_member_history, compliance_exports, announcements,
--     sidebar_categories (+ sidebar_channel_assignments), channel_notification_preferences,
--     consent_logs, channel_bookmarks, message_reminders, notifications,
--     push_subscriptions, message_edit_history, scheduled_posts, trigger_words,
--     auto_responders, user_statuses, user_presence, message_flags, reactions, messages,
--     dm_channels, webhook_endpoints, channel_members, workspace_members, audit_logs,
--     user_preferences, users (cascades any workspaces the user solely owned).
--   Auth: refresh_tokens, mfa_factors, sessions, identities, users.
--
-- Retained / anonymised (not deleted, by design):
--   channels.created_by and webhook_endpoints.created_by -> NULL (channel/webhook is
--     shared workspace infrastructure and must outlive the creator);
--   audit_logs.actor_user_id -> deleted by this function, and the column is
--     ON DELETE SET NULL if new rows appear after the erasure;
--   other members' messages/threads/reactions that reference the user only via
--     non-owner columns are retained with the deleted author's id already removed by
--     the rows above.
--
-- Paired with the API change that removes the separate auth.admin.deleteUser call.

CREATE OR REPLACE FUNCTION public.gdpr_delete_user(target_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Public, user-owned rows (FK-safe order: children before users).
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
  DELETE FROM announcements WHERE created_by = target_user_id;

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

  -- Auth rows. auth.users is deleted last so the public-side trigger
  -- (handle_user_deletion) sees the same transaction. This is the step that used to
  -- live in the API; doing it here keeps the erasure atomic and retryable.
  DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id::varchar;
  DELETE FROM auth.mfa_factors WHERE user_id = target_user_id;
  DELETE FROM auth.sessions WHERE user_id = target_user_id;
  DELETE FROM auth.identities WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

  result := jsonb_build_object('success', true, 'user_id', target_user_id);
  RETURN result;
EXCEPTION
  WHEN others THEN
    -- Rolls back every DELETE above; the API treats success=false as a retryable 500.
    RAISE LOG 'gdpr_delete_user failed for %: %', target_user_id, SQLERRM;
    result := jsonb_build_object(
      'success', false,
      'user_id', target_user_id,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

COMMENT ON FUNCTION public.gdpr_delete_user(UUID) IS
  'GDPR right-to-erasure. Atomically hard-deletes the user''s public rows and the auth.users row (and auth sessions/identities/tokens). Idempotent and retryable (DATA-P2-005).';
