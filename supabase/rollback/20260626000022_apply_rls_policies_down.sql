-- Rollback for: 20260626000022_apply_rls_policies.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "users_select_own";
DROP POLICY IF EXISTS "users_update_own";
DROP POLICY IF EXISTS "workspaces_select_member";
DROP POLICY IF EXISTS "workspace_members_select_own";
DROP POLICY IF EXISTS "channels_select_member";
DROP POLICY IF EXISTS "channel_members_select_member";
DROP POLICY IF EXISTS "messages_select_member";
DROP POLICY IF EXISTS "messages_insert_own";
DROP POLICY IF EXISTS "messages_update_own";
DROP POLICY IF EXISTS "messages_delete_own";
DROP POLICY IF EXISTS "user_preferences_select_own";
DROP POLICY IF EXISTS "user_preferences_insert_own";
DROP POLICY IF EXISTS "user_preferences_update_own";
DROP POLICY IF EXISTS "reactions_select";
DROP POLICY IF EXISTS "reactions_insert_own";
DROP POLICY IF EXISTS "reactions_delete_own";
DROP POLICY IF EXISTS "push_subscriptions_select_own";
DROP POLICY IF EXISTS "push_subscriptions_insert_own";
DROP POLICY IF EXISTS "push_subscriptions_delete_own";
DROP POLICY IF EXISTS "push_subscriptions_update_own";
DROP POLICY IF EXISTS "notifications_select_own";
DROP POLICY IF EXISTS "notifications_update_own";
DROP POLICY IF EXISTS "webhook_endpoints_select_workspace_member";
DROP POLICY IF EXISTS "webhook_endpoints_manage_workspace_admin";
DROP POLICY IF EXISTS "webhook_deliveries_select_workspace_member";
DROP POLICY IF EXISTS "webhook_dead_letters_select_workspace_member";
DROP POLICY IF EXISTS "audit_logs_select_authenticated";
DROP POLICY IF EXISTS "audit_logs_insert_authenticated";
DROP POLICY IF EXISTS "feature_flags_select_admin";
DROP POLICY IF EXISTS "feature_flags_manage_admin";

COMMIT;
