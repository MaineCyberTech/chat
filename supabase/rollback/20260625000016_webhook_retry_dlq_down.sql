-- Rollback for: 20260625000016_webhook_retry_dlq.sql
-- Generated on: ...

BEGIN;

DROP FUNCTION IF EXISTS public.process_webhook_retries CASCADE;
DROP FUNCTION IF EXISTS public.schedule_webhook_retry CASCADE;
DROP POLICY IF EXISTS "webhook_dead_letters_select_workspace_member" ON public.webhook_dead_letters;
ALTER TABLE IF EXISTS public.webhook_dead_letters DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_webhook_dead_letters_webhook;
DROP TABLE IF EXISTS public.webhook_dead_letters CASCADE;
ALTER TABLE IF EXISTS public.webhook_deliveries DROP COLUMN IF EXISTS retry_count;

COMMIT;
