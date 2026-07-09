-- Rollback for auto_responder migration
DROP TRIGGER IF EXISTS auto_reply_trigger ON messages;
DROP FUNCTION IF EXISTS public.auto_reply();
DROP TABLE IF EXISTS auto_responders;
