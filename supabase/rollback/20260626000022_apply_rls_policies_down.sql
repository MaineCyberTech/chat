-- Rollback for: 20260626000022_apply_rls_policies.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "feature_flags_manage_admin" ON public.feature_flags;
DROP POLICY IF EXISTS "feature_flags_select_admin" ON public.feature_flags;
DROP POLICY IF EXISTS "audit_logs_insert_authenticated" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_authenticated" ON public.audit_logs;
DROP POLICY IF EXISTS "webhook_dead_letters_select_workspace_member" ON public.webhook_dead_letters;
DROP POLICY IF EXISTS "webhook_deliveries_select_workspace_member" ON public.webhook_deliveries;
DROP POLICY IF EXISTS "webhook_endpoints_manage_workspace_admin" ON public.webhook_endpoints;
DROP POLICY IF EXISTS "webhook_endpoints_select_workspace_member" ON public.webhook_endpoints;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "push_subscriptions_update_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "reactions_delete_own" ON public.reactions;
DROP POLICY IF EXISTS "reactions_insert_own" ON public.reactions;
DROP POLICY IF EXISTS "reactions_select" ON public.reactions;
DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_insert_own" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_select_own" ON public.user_preferences;
DROP POLICY IF EXISTS "messages_delete_own" ON public.messages;
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
DROP POLICY IF EXISTS "messages_select_member" ON public.messages;
DROP POLICY IF EXISTS "channel_members_select_member" ON public.channel_members;
DROP POLICY IF EXISTS "channels_select_member" ON public.channels;
DROP POLICY IF EXISTS "workspace_members_select_own" ON public.workspace_members;
DROP POLICY IF EXISTS "workspaces_select_member" ON public.workspaces;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;

COMMIT;
