-- Fix handle_thread_reply() trigger: column reference "thread_id" is ambiguous
-- The deployed function uses "thread_id" as PL/pgSQL variable name, conflicting with column name.
-- Fix: rename variable to v_thread_id (matching the original migration definition).

CREATE OR REPLACE FUNCTION public.handle_thread_reply()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_id UUID;
BEGIN
  -- Upsert thread_metadata for the parent message
  INSERT INTO public.thread_metadata (message_id, reply_count, participant_count, last_activity_at)
  VALUES (NEW.parent_id, 1, 1, NEW.created_at)
  ON CONFLICT (message_id) DO UPDATE SET
    reply_count = thread_metadata.reply_count + 1,
    last_activity_at = GREATEST(thread_metadata.last_activity_at, NEW.created_at)
  RETURNING id INTO v_thread_id;

  -- Add replier as thread participant
  INSERT INTO public.thread_participants (thread_id, user_id)
  VALUES (v_thread_id, NEW.user_id)
  ON CONFLICT (thread_id, user_id) DO UPDATE SET
    last_read_at = NEW.created_at;

  -- Also add parent message author as participant
  INSERT INTO public.thread_participants (thread_id, user_id)
  SELECT v_thread_id, m.user_id FROM public.messages m WHERE m.id = NEW.parent_id
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
