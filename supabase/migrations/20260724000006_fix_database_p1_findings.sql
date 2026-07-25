-- P1 database hardening fixes
-- 1. webhook_endpoints.created_by: auth.users -> public.users + ON DELETE SET NULL
-- 2. announcements.created_by: add FK to public.users
-- 3. user_groups RLS: consolidate policies with admin+owner checks
-- 4. compliance_exports RLS: restore workspace_id scoping
-- 5. users SELECT: restrict to self + workspace co-members
-- 6. GDPR: add announcements + auth tables cleanup

-- Fix 1: webhook_endpoints.created_by — change FK target, SET NULL, make nullable
ALTER TABLE public.webhook_endpoints
  DROP CONSTRAINT IF EXISTS webhook_endpoints_created_by_fkey;
ALTER TABLE public.webhook_endpoints
  ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.webhook_endpoints
  ADD CONSTRAINT webhook_endpoints_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Fix 2: announcements.created_by — add FK to public.users
ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix 3: user_groups RLS — consolidate to admin/owner + creator; drop stale policies
DROP POLICY IF EXISTS "Workspace members can view groups" ON public.user_groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON public.user_groups;
DROP POLICY IF EXISTS "Admins can update groups" ON public.user_groups;
DROP POLICY IF EXISTS "Admins can delete groups" ON public.user_groups;
DROP POLICY IF EXISTS "Groups are visible to workspace members" ON public.user_groups;
DROP POLICY IF EXISTS "Users create and manage their own groups" ON public.user_groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.user_groups;
DROP POLICY IF EXISTS "Group creators can delete their groups" ON public.user_groups;
DROP POLICY IF EXISTS "Group members can view member list" ON public.user_group_members;
DROP POLICY IF EXISTS "Admins can manage group members" ON public.user_group_members;
DROP POLICY IF EXISTS "Group members visible to workspace members" ON public.user_group_members;
DROP POLICY IF EXISTS "Group creators manage members" ON public.user_group_members;

CREATE POLICY "user_groups_select" ON public.user_groups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = user_groups.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "user_groups_insert" ON public.user_groups FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = user_groups.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('admin', 'owner')
  ));

CREATE POLICY "user_groups_update" ON public.user_groups FOR UPDATE
  USING (
    user_groups.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = user_groups.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    user_groups.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = user_groups.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "user_groups_delete" ON public.user_groups FOR DELETE
  USING (
    user_groups.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = user_groups.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "user_group_members_select" ON public.user_group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_groups ug
    JOIN public.workspace_members wm ON wm.workspace_id = ug.workspace_id
    WHERE ug.id = user_group_members.group_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "user_group_members_all" ON public.user_group_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_groups ug
      WHERE ug.id = user_group_members.group_id AND ug.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_groups ug
      JOIN public.workspace_members wm ON wm.workspace_id = ug.workspace_id
      WHERE ug.id = user_group_members.group_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_groups ug
      WHERE ug.id = user_group_members.group_id AND ug.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_groups ug
      JOIN public.workspace_members wm ON wm.workspace_id = ug.workspace_id
      WHERE ug.id = user_group_members.group_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('admin', 'owner')
    )
  );

-- Fix 4: compliance_exports RLS — restore workspace-scoped admin check
DROP POLICY IF EXISTS compliance_exports_select ON public.compliance_exports;

CREATE POLICY compliance_exports_select ON public.compliance_exports
  FOR SELECT USING (
    workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = compliance_exports.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- Fix 5: users SELECT — restrict to self + workspace co-members
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;

CREATE POLICY "users_select" ON public.users
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm1
      JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = users.id
    )
  );

-- Fix 6: GDPR — add announcements + auth token/identity cleanup
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

  DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id::varchar;
  DELETE FROM auth.mfa_factors WHERE user_id = target_user_id;
  DELETE FROM auth.sessions WHERE user_id = target_user_id;
  DELETE FROM auth.identities WHERE user_id = target_user_id;

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

-- Fix 7: handle_user_deletion() — add announcements cleanup
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
  DELETE FROM public.announcements WHERE created_by = OLD.id;
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
