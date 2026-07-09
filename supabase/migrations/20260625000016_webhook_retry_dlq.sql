-- Webhook retry and dead letter queue
-- Run after webhooks.sql

-- Add retry tracking to webhook_deliveries
ALTER TABLE public.webhook_deliveries
ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dead_letter BOOLEAN NOT NULL DEFAULT FALSE;

-- Dead letter queue for permanently failed deliveries
CREATE TABLE IF NOT EXISTS public.webhook_dead_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  request_body JSONB NOT NULL,
  last_error TEXT,
  attempt_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_dead_letters_webhook
  ON public.webhook_dead_letters (webhook_id, created_at DESC);

ALTER TABLE public.webhook_dead_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_dead_letters_select_workspace_member"
  ON public.webhook_dead_letters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.webhook_endpoints we
      JOIN public.workspace_members wm ON wm.workspace_id = we.workspace_id
      WHERE we.id = webhook_dead_letters.webhook_id
      AND wm.user_id = auth.uid()
    )
  );

-- Function to schedule retry with exponential backoff
CREATE OR REPLACE FUNCTION public.schedule_webhook_retry(
  delivery_id UUID,
  max_retries INT DEFAULT 5,
  base_delay_seconds INT DEFAULT 60
)
RETURNS VOID AS $$
DECLARE
  delivery RECORD;
  next_delay INT;
BEGIN
  SELECT * INTO delivery FROM public.webhook_deliveries WHERE id = delivery_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF delivery.retry_count >= max_retries THEN
    -- Move to dead letter queue
    INSERT INTO public.webhook_dead_letters (webhook_id, event, request_body, last_error, attempt_count, last_attempt_at)
    VALUES (delivery.webhook_id, delivery.event, delivery.request_body, delivery.error, delivery.retry_count, now());

    UPDATE public.webhook_deliveries
    SET dead_letter = TRUE
    WHERE id = delivery_id;

    RETURN;
  END IF;

  -- Exponential backoff: base_delay * 2^retry_count + jitter
  next_delay := base_delay_seconds * (2 ^ delivery.retry_count) + FLOOR(RANDOM() * 30)::INT;

  UPDATE public.webhook_deliveries
  SET retry_count = retry_count + 1,
      next_retry_at = NOW() + (next_delay || ' seconds')::INTERVAL
  WHERE id = delivery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to process pending retries (call via pg_cron)
CREATE OR REPLACE FUNCTION public.process_webhook_retries()
RETURNS INT AS $$
DECLARE
  processed INT := 0;
BEGIN
  FOR delivery IN
    SELECT * FROM public.webhook_deliveries
    WHERE status = 'failed'
      AND dead_letter = FALSE
      AND next_retry_at IS NOT NULL
      AND next_retry_at <= NOW()
    LIMIT 100
  LOOP
    -- This will be called by the application layer via HTTP
    -- We just mark it as ready for retry
    processed := processed + 1;
  END LOOP;
  RETURN processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.process_webhook_retries IS 'Returns count of deliveries ready for retry. Call via pg_cron every minute: SELECT cron.schedule(''webhook-retries'', ''* * * * *'', ''SELECT public.process_webhook_retries()'')';