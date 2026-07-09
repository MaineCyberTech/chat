-- Rollback read receipts migration
DROP TABLE IF EXISTS public.message_reads CASCADE;
ALTER TABLE public.channel_members DROP COLUMN IF EXISTS last_viewed_at;
