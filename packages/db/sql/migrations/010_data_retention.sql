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