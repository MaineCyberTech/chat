-- Add missing indexes identified by audit

CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON public.reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_id ON public.notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status_retry ON public.webhook_deliveries(status, next_retry_at) WHERE dead_letter = false;
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_dead_letter ON public.webhook_deliveries(dead_letter) WHERE dead_letter = true;
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_channels_workspace_deleted ON public.channels(workspace_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_messages_user_created ON public.messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_role ON public.workspace_members(user_id, role);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_user ON public.channel_members(channel_id, user_id);
