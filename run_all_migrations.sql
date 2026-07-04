-- 001_users.sql
-- Create the public.users table linked to auth.users.
-- Run this in the Supabase SQL editor or via migration tooling.

-- Extension for UUID generation (should already be enabled by Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  display_name TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- 002_workspaces.sql
-- Workspaces and workspace membership.
-- Run after 001_users.sql.

CREATE TABLE IF NOT EXISTS public.workspaces (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  owner_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Auto-add owner as workspace member on create
CREATE OR REPLACE FUNCTION public.handle_new_workspace()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS on_workspace_created ON public.workspaces;
CREATE TRIGGER on_workspace_created
  AFTER INSERT ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_workspace();

-- Generate a URL-safe slug from name
CREATE OR REPLACE FUNCTION public.generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'));
END;
$$ LANGUAGE plpgsql;

-- updated_at trigger
CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- 003_channels.sql
-- Channels within workspaces.
-- Run after 002_workspaces.sql.

CREATE TABLE IF NOT EXISTS public.channels (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  topic         TEXT,
  is_private    BOOLEAN NOT NULL DEFAULT false,
  created_by    UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, slug)
);

CREATE TABLE IF NOT EXISTS public.channel_members (
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- Auto-add creator as channel member
CREATE OR REPLACE FUNCTION public.handle_new_channel()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.channel_members (channel_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS on_channel_created ON public.channels;
CREATE TRIGGER on_channel_created
  AFTER INSERT ON public.channels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_channel();

CREATE TRIGGER channels_updated_at
  BEFORE UPDATE ON public.channels
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- 004_messages.sql
-- Messages within channels.
-- Run after 003_channels.sql.

CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id  UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  parent_id   UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  edited_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_channel_created
  ON public.messages (channel_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;


-- 005_search.sql
-- Full-text search on messages.
-- Run after 004_messages.sql.

CREATE INDEX idx_messages_content_fts
  ON public.messages
  USING GIN (to_tsvector('english', content));

-- Search function
CREATE OR REPLACE FUNCTION public.search_messages(
  workspace_id UUID,
  query_text TEXT,
  result_limit INT DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  channel_id UUID,
  user_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.channel_id,
    m.user_id,
    m.content,
    m.created_at,
    ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', query_text)) AS rank
  FROM public.messages m
  JOIN public.channels ch ON ch.id = m.channel_id
  WHERE ch.workspace_id = workspace_id
    AND to_tsvector('english', m.content) @@ plainto_tsquery('english', query_text)
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_id
        AND wm.user_id = auth.uid()
    )
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

COMMENT ON FUNCTION public.search_messages IS 'Search messages with workspace membership check enforced via SECURITY INVOKER and WHERE clause.';


CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id             UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  theme               TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
  notification_prefs  JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preferences_select_own"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_insert_own"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_update_own"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);


-- 007_add_missing_indexes.sql
-- Add missing indexes for query performance
-- Run after 006_user_preferences.sql

-- Index for workspace_members.user_id (most common query: "find all workspaces for user X")
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id
  ON public.workspace_members (user_id);

-- Index for channel_members.user_id (query: "find all channels for user X")
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id
  ON public.channel_members (user_id);

-- Partial index for messages.parent_id (threaded replies)
CREATE INDEX IF NOT EXISTS idx_messages_parent_id
  ON public.messages (parent_id) WHERE parent_id IS NOT NULL;


CREATE TABLE IF NOT EXISTS public.reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_select"
  ON public.reactions FOR SELECT
  USING (true);

CREATE POLICY "reactions_insert_own"
  ON public.reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reactions_delete_own"
  ON public.reactions FOR DELETE
  USING (auth.uid() = user_id);


-- 008_audit_log_pruning.sql
-- Add cron job for audit log pruning
-- Run after 006_user_preferences.sql

-- Enable pg_cron extension (requires superuser, run manually in Supabase)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to prune audit logs older than 90 days
CREATE OR REPLACE FUNCTION public.prune_audit_logs()
RETURNS void AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete audit logs older than 90 days
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log the pruning operation
  INSERT INTO public.audit_logs (action, entity_type, entity_id, metadata)
  VALUES ('audit_log_prune', 'audit_log', NULL, jsonb_build_object('deleted_count', deleted_count, 'retention_days', 90));

  RAISE NOTICE 'Pruned % audit log entries older than 90 days', deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Schedule the pruning to run daily at 3 AM UTC
-- SELECT cron.schedule('prune-audit-logs', '0 3 * * *', 'SELECT public.prune_audit_logs()');

-- Manual trigger function for immediate pruning
COMMENT ON FUNCTION public.prune_audit_logs IS 'Prunes audit logs older than 90 days. Schedule via pg_cron: SELECT cron.schedule(''prune-audit-logs'', ''0 3 * * *'', ''SELECT public.prune_audit_logs()'')';


-- Push notification subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint        TEXT NOT NULL,
  p256dh          TEXT NOT NULL,
  auth            TEXT NOT NULL,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select_own"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_insert_own"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_delete_own"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_update_own"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for efficient lookup by user_id
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx 
  ON public.push_subscriptions(user_id);


-- 009_soft_delete.sql
-- Add soft delete support for workspaces, channels, messages
-- Run after 008_audit_log_pruning.sql

-- Add deleted_at column to workspaces
ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at column to channels
ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at column to messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add partial indexes for performance (only index non-deleted rows)
CREATE INDEX IF NOT EXISTS idx_workspaces_deleted_at
  ON public.workspaces (deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_channels_deleted_at
  ON public.channels (deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_deleted_at
  ON public.messages (deleted_at) WHERE deleted_at IS NOT NULL;

-- Update RLS policies to exclude soft-deleted items by default
-- Workspaces: exclude deleted workspaces from SELECT
DROP POLICY IF EXISTS "workspaces_select_member" ON public.workspaces;
CREATE POLICY "workspaces_select_member"
ON public.workspaces FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = workspaces.id
    AND user_id = auth.uid()
  )
);

-- Channels: exclude deleted channels from SELECT
DROP POLICY IF EXISTS "channels_select_member" ON public.channels;
CREATE POLICY "channels_select_member"
ON public.channels FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = channels.workspace_id
    AND user_id = auth.uid()
  )
);

-- Messages: exclude deleted messages from SELECT
DROP POLICY IF EXISTS "messages_select_member" ON public.messages;
CREATE POLICY "messages_select_member"
ON public.messages FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.channels ch
    JOIN public.workspace_members wm ON wm.workspace_id = ch.workspace_id
    WHERE ch.id = messages.channel_id
    AND wm.user_id = auth.uid()
  )
);

-- Soft delete functions
CREATE OR REPLACE FUNCTION public.soft_delete_workspace(workspace_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.workspaces
  SET deleted_at = NOW()
  WHERE id = workspace_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.soft_delete_channel(channel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.channels
  SET deleted_at = NOW()
  WHERE id = channel_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.soft_delete_message(message_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.messages
  SET deleted_at = NOW()
  WHERE id = message_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Restore functions
CREATE OR REPLACE FUNCTION public.restore_workspace(workspace_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.workspaces
  SET deleted_at = NULL
  WHERE id = workspace_id AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.restore_channel(channel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.channels
  SET deleted_at = NULL
  WHERE id = channel_id AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.restore_message(message_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.messages
  SET deleted_at = NULL
  WHERE id = message_id AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 010_data_retention.sql
-- Data retention and archival policies
-- Run after 009_soft_delete.sql

-- Add archived_at column to messages for archival (separate from soft delete)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add partial index for archived messages
CREATE INDEX IF NOT EXISTS idx_messages_archived_at
  ON public.messages (archived_at) WHERE archived_at IS NOT NULL;

-- Function to archive messages older than specified days
-- This moves messages to "archived" state (separate from soft delete)
CREATE OR REPLACE FUNCTION public.archive_old_messages(
  channel_id UUID DEFAULT NULL,
  days_threshold INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE public.messages
  SET archived_at = NOW()
  WHERE archived_at IS NULL
    AND deleted_at IS NULL
    AND created_at < NOW() - (days_threshold || ' days')::INTERVAL
    AND (channel_id = channel_id OR channel_id IS NULL);

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to purge archived messages (hard delete) after extended retention
-- This permanently removes messages that have been archived for a long time
CREATE OR REPLACE FUNCTION public.purge_archived_messages(
  channel_id UUID DEFAULT NULL,
  days_threshold INTEGER DEFAULT 2555 -- ~7 years
)
RETURNS INTEGER AS $$
DECLARE
  purged_count INTEGER;
BEGIN
  -- First, delete related reactions, reactions
  DELETE FROM public.reactions
  WHERE message_id IN (
    SELECT id FROM public.messages
    WHERE archived_at IS NOT NULL
      AND archived_at < NOW() - (days_threshold || ' days')::INTERVAL
      AND (channel_id = channel_id OR channel_id IS NULL)
  );

  -- Delete the archived messages
  DELETE FROM public.messages
  WHERE archived_at IS NOT NULL
    AND archived_at < NOW() - (days_threshold || ' days')::INTERVAL
    AND (channel_id = channel_id OR channel_id IS NULL);

  GET DIAGNOSTICS purged_count = ROW_COUNT;

  RETURN purged_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Schedule archival to run weekly (e.g., Sunday 2 AM UTC)
-- SELECT cron.schedule('archive-old-messages', '0 2 * * 0', 'SELECT public.archive_old_messages()');

-- Schedule purging to run monthly (e.g., 1st of month 3 AM UTC)
-- SELECT cron.schedule('purge-archived-messages', '0 3 1 * *', 'SELECT public.purge_archived_messages()');

-- Comment with usage instructions
COMMENT ON FUNCTION public.archive_old_messages IS 'Archives messages older than threshold (default 365 days). Schedule via pg_cron: SELECT cron.schedule(''archive-old-messages'', ''0 2 * * 0'', ''SELECT public.archive_old_messages()'')';
COMMENT ON FUNCTION public.purge_archived_messages IS 'Permanently purges messages archived longer than threshold (default 7 years). Schedule via pg_cron: SELECT cron.schedule(''purge-archived-messages'', ''0 3 1 * *'', ''SELECT public.purge_archived_messages()'')';


-- Webhook retry and dead letter queue
-- Run after webhooks.sql

-- Add retry tracking to webhook_deliveries
ALTER TABLE public.webhook_deliveries
ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dead_letter BOOLEAN NOT NULL DEFAULT FALSE;

-- Dead letter queue for permanently failed deliveries
CREATE TABLE IF NOT EXISTS public.webhook_dead_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  request_body JSONB NOT NULL,
  last_error TEXT,
  attempt_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_dead_letters_webhook
  ON public.webhook_dead_letters (webhook_id, created_at DESC);

ALTER TABLE public.webhook_dead_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_dead_letters_select_workspace_member"
  ON public.webhook_dead_letters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.webhook_endpoints we
      JOIN public.workspace_members wm ON wm.workspace_id = we.workspace_id
      WHERE we.id = webhook_dead_letters.webhook_id
      AND wm.user_id = auth.uid()
    )
  );

-- Function to schedule retry with exponential backoff
CREATE OR REPLACE FUNCTION public.schedule_webhook_retry(
  delivery_id UUID,
  max_retries INT DEFAULT 5,
  base_delay_seconds INT DEFAULT 60
)
RETURNS VOID AS $$
DECLARE
  delivery RECORD;
  next_delay INT;
BEGIN
  SELECT * INTO delivery FROM public.webhook_deliveries WHERE id = delivery_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF delivery.retry_count >= max_retries THEN
    -- Move to dead letter queue
    INSERT INTO public.webhook_dead_letters (webhook_id, event, request_body, last_error, attempt_count, last_attempt_at)
    VALUES (delivery.webhook_id, delivery.event, delivery.request_body, delivery.error, delivery.retry_count, now());

    UPDATE public.webhook_deliveries
    SET dead_letter = TRUE
    WHERE id = delivery_id;

    RETURN;
  END IF;

  -- Exponential backoff: base_delay * 2^retry_count + jitter
  next_delay := base_delay_seconds * (2 ^ delivery.retry_count) + FLOOR(RANDOM() * 30)::INT;

  UPDATE public.webhook_deliveries
  SET retry_count = retry_count + 1,
      next_retry_at = NOW() + (next_delay || ' seconds')::INTERVAL
  WHERE id = delivery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to process pending retries (call via pg_cron)
CREATE OR REPLACE FUNCTION public.process_webhook_retries()
RETURNS INT AS $$
DECLARE
  processed INT := 0;
  delivery RECORD;
BEGIN
  FOR delivery IN
    SELECT * FROM public.webhook_deliveries
    WHERE status = 'failed'
      AND dead_letter = FALSE
      AND next_retry_at IS NOT NULL
      AND next_retry_at <= NOW()
    LIMIT 100
  LOOP
    -- This will be called by the application layer via HTTP
    -- We just mark it as ready for retry
    processed := processed + 1;
  END LOOP;
  RETURN processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.process_webhook_retries IS 'Returns count of deliveries ready for retry. Call via pg_cron every minute: SELECT cron.schedule(''webhook-retries'', ''* * * * *'', ''SELECT public.process_webhook_retries()'')';


-- Add foreign key constraint to audit_logs.organization_id referencing workspaces
-- Run after 006_user_preferences.sql

-- First, verify that organization_id values reference existing workspaces
-- This will fail if there are orphaned organization_id values
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM public.audit_logs al
  WHERE al.organization_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.workspaces w WHERE w.id = al.organization_id
    );

  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % orphaned organization_id values in audit_logs. These will need to be cleaned up before adding FK.', orphaned_count;
    -- Optionally, set them to NULL or delete them
    -- UPDATE public.audit_logs SET organization_id = NULL WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.workspaces WHERE id = audit_logs.organization_id);
  END IF;
END $$;

-- Add foreign key constraint
ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES public.workspaces(id)
ON DELETE SET NULL;

-- Also add a comment to clarify the relationship
COMMENT ON COLUMN public.audit_logs.organization_id IS 'References public.workspaces(id) - the workspace this audit event belongs to';

-- Update RLS policy to allow workspace admins/owners to view audit logs
DROP POLICY IF EXISTS "audit_logs_select_authenticated" ON public.audit_logs;
CREATE POLICY "audit_logs_select_authenticated"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  actor_user_id = auth.uid()
  OR (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = audit_logs.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
);


-- Add unique constraint on workspace_members.role = 'owner'
-- Run after 002_workspaces.sql

-- Ensure only one owner per workspace
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_unique_owner
  ON public.workspace_members (workspace_id)
  WHERE role = 'owner';

-- Also add check constraint to ensure role values are valid (already exists in table definition)
-- But we can add a comment for clarity
COMMENT ON COLUMN public.workspace_members.role IS 'Member role: owner, admin, or member. Only one owner per workspace enforced by partial unique index.';


-- Feature flags table
create table if not exists public.feature_flags (
  key text primary key,
  name text not null,
  description text,
  enabled boolean not null default false,
  rollout_percentage integer not null default 0 check (rollout_percentage >= 0 and rollout_percentage <= 100),
  target_roles text[] not null default '{}',
  target_user_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_feature_flags_enabled
  on public.feature_flags (enabled);

alter table public.feature_flags enable row level security;

-- Only workspace owners/admins can manage feature flags
create policy "feature_flags_select_admin"
  on public.feature_flags for select
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

create policy "feature_flags_manage_admin"
  on public.feature_flags for all
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- Trigger to update updated_at
create trigger feature_flags_updated_at
  before update on public.feature_flags
  for each row
  execute function public.set_updated_at();

-- Seed some initial flags
insert into public.feature_flags (key, name, description, enabled, rollout_percentage)
values
  ('new-thread-ui', 'New Thread UI', 'Enable the redesigned thread view', true, 100),
  ('reactions-v2', 'Reactions v2', 'New reaction picker with categories', false, 50),
  ('dark-mode-auto', 'Auto Dark Mode', 'Automatically switch to dark mode based on system preference', true, 100),
  ('push-notifications', 'Push Notifications', 'Enable browser push notifications', true, 100),
  ('message-editing', 'Message Editing', 'Allow users to edit sent messages', true, 100)
on conflict (key) do nothing;


-- Audit logging
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.workspaces(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type text not null default 'user',
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_org_created_at
  on public.audit_logs (organization_id, created_at desc);

create index if not exists idx_audit_logs_actor
  on public.audit_logs (actor_user_id);

alter table public.audit_logs enable row level security;

-- Users can read their own audit log entries
-- Workspace admins/owners can read audit logs for their workspace
-- Server-side writes use service_role which bypasses RLS
create policy "audit_logs_select_authenticated"
on public.audit_logs for select
to authenticated
using (
  actor_user_id = auth.uid()
  or (
    organization_id is not null
    and exists (
      select 1 from public.workspace_members
      where workspace_id = audit_logs.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  )
);

-- Inserts are handled server-side via service role, but if direct inserts are needed:
create policy "audit_logs_insert_authenticated"
on public.audit_logs for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and actor_type = 'user'
);


-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, read, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- Webhook management
create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  url text not null constraint webhook_url_https check (url ~ '^https://'),
  secret text not null default '',
  events text[] not null default '{}',
  is_active boolean not null default true,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_error text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_webhook_endpoints_workspace
  on public.webhook_endpoints (workspace_id);

alter table public.webhook_endpoints enable row level security;

create policy "webhook_endpoints_select_workspace_member"
on public.webhook_endpoints for select
to authenticated
using (
  exists (
    select 1 from public.workspace_members
    where workspace_id = webhook_endpoints.workspace_id
    and user_id = auth.uid()
  )
);

create policy "webhook_endpoints_manage_workspace_admin"
on public.webhook_endpoints for all
to authenticated
using (
  exists (
    select 1 from public.workspace_members
    where workspace_id = webhook_endpoints.workspace_id
      and user_id = auth.uid()
      and role IN ('owner', 'admin')
  )
)
with check (
  exists (
    select 1 from public.workspace_members
    where workspace_id = webhook_endpoints.workspace_id
      and user_id = auth.uid()
      and role IN ('owner', 'admin')
  )
);

-- Webhook delivery log
create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhook_endpoints(id) on delete cascade,
  event text not null,
  status text not null,
  request_body jsonb,
  response_status int,
  response_body text,
  error text,
  duration_ms int,
  created_at timestamptz not null default now()
);

create index if not exists idx_webhook_deliveries_webhook
  on public.webhook_deliveries (webhook_id, created_at desc);

alter table public.webhook_deliveries enable row level security;

create policy "webhook_deliveries_select_workspace_member"
on public.webhook_deliveries for select
to authenticated
using (
  exists (
    select 1 from public.webhook_endpoints we
    join public.workspace_members wm on wm.workspace_id = we.workspace_id
    where we.id = webhook_deliveries.webhook_id
    and wm.user_id = auth.uid()
  )
);


