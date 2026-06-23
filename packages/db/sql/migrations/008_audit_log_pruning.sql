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