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
$$ LANGUAGE plpgsql SECURITY DEFINER;
