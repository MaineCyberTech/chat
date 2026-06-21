-- 005_search.sql
-- Full-text search on messages.
-- Run after 004_messages.sql.

CREATE INDEX idx_messages_content_fts
  ON public.messages
  USING GIN (to_tsvector('english', content));

-- Search function
CREATE OR REPLACE FUNCTION public.search_messages(
  workspace_id UUID,
  query_text TEXT,
  result_limit INT DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  channel_id UUID,
  user_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  -- Verify the caller is a member of the workspace
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = search_messages.workspace_id
      AND user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.channel_id,
    m.user_id,
    m.content,
    m.created_at,
    ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', query_text)) AS rank
  FROM public.messages m
  JOIN public.channels ch ON ch.id = m.channel_id
  WHERE ch.workspace_id = workspace_id
    AND to_tsvector('english', m.content) @@ plainto_tsquery('english', query_text)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.search_messages IS 'Search messages with workspace membership check. SECURITY DEFINER requires explicit auth.uid() guard.';
