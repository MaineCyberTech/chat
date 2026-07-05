ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Backfill sort_order for existing channels (order by created_at)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY workspace_id ORDER BY created_at ASC) - 1 AS rn
  FROM public.channels
)
UPDATE public.channels c
SET sort_order = n.rn
FROM numbered n
WHERE c.id = n.id;
