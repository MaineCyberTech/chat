-- Rollback for: 20260625000016_webhook_retry_dlq.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.webhook_dead_letters CASCADE;
DROP INDEX IF EXISTS idx_webhook_dead_letters_webhook;
ALTER TABLE public.webhook_dead_letters DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "webhook_dead_letters_select_workspace_member";
DROP FUNCTION IF EXISTS public.schedule_webhook_retry(;
-- Manual rollback needed: UPDATE on public.webhook_deliveries
-- Manual rollback needed: UPDATE on public.webhook_deliveries
DROP FUNCTION IF EXISTS public.process_webhook_retries();

COMMIT;
