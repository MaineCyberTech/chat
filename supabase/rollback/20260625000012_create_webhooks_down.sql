-- Rollback for: 20260625000012_create_webhooks.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "webhook_deliveries_select_workspace_member" ON public.webhook_deliveries;
ALTER TABLE IF EXISTS public.webhook_deliveries DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_webhook_deliveries_webhook;
DROP TABLE IF EXISTS public.webhook_deliveries CASCADE;
DROP POLICY IF EXISTS "webhook_endpoints_manage_workspace_admin" ON public.webhook_endpoints;
DROP POLICY IF EXISTS "webhook_endpoints_select_workspace_member" ON public.webhook_endpoints;
ALTER TABLE IF EXISTS public.webhook_endpoints DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_webhook_endpoints_workspace;
DROP TABLE IF EXISTS public.webhook_endpoints CASCADE;

COMMIT;
