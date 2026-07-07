-- Drop channel member history tracking
DROP TRIGGER IF EXISTS on_channel_member_joined ON public.channel_members;
DROP FUNCTION IF EXISTS public.log_channel_member_join;
DROP INDEX IF EXISTS idx_channel_member_history_channel;
DROP TABLE IF EXISTS public.channel_member_history;
