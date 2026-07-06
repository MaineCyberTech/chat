-- Rollback for: 20260625000012_create_webhooks.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.webhook_endpoints CASCADE;
DROP INDEX IF EXISTS idx_webhook_endpoints_workspace;
ALTER TABLE public.webhook_endpoints DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "webhook_endpoints_select_workspace_member";
DROP POLICY IF EXISTS "webhook_endpoints_manage_workspace_admin";
DROP TABLE IF EXISTS public.webhook_deliveries CASCADE;
DROP INDEX IF EXISTS idx_webhook_deliveries_webhook;
ALTER TABLE public.webhook_deliveries DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "webhook_deliveries_select_workspace_member";

COMMIT;
