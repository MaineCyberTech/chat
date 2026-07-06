-- Rollback for: 20260705000001_add_channel_sort_order.sql
-- Generated on: ...

BEGIN;

ALTER TABLE public.channels DROP COLUMN IF EXISTS sort_order;
-- Manual rollback needed: UPDATE on public.channels

COMMIT;
