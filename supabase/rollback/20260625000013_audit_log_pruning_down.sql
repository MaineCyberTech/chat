-- Rollback for: 20260625000013_audit_log_pruning.sql
-- Generated on: ...

BEGIN;

DROP FUNCTION IF EXISTS public.prune_audit_logs CASCADE;
-- Extension pg_cron; cannot be removed via DROP; skip manual removal if unused

COMMIT;
