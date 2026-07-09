-- Enhanced search with date range, author, and channel filters
-- Replaces the original search_messages function

-- Drop old overloads (signature differs from original 3-param version)
DROP FUNCTION IF EXISTS public.search_messages(UUID, TEXT, INT);
DROP FUNCTION IF EXISTS public.search_messages(UUID, TEXT, INT, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID[]);

CREATE OR REPLACE FUNCTION public.search_messages(
  workspace_id UUID,
  query_text TEXT,
  result_limit INT DEFAULT 20,
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL,
  author_id UUID DEFAULT NULL,
  channel_ids UUID[] DEFAULT NULL
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
  WHERE ch.workspace_id = search_messages.workspace_id
    AND m.deleted_at IS NULL
    AND to_tsvector('english', m.content) @@ plainto_tsquery('english', query_text)
    AND (date_from IS NULL OR m.created_at >= date_from)
    AND (date_to IS NULL OR m.created_at <= date_to)
    AND (author_id IS NULL OR m.user_id = author_id)
    AND (channel_ids IS NULL OR ch.id = ANY(channel_ids))
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = search_messages.workspace_id
        AND wm.user_id = auth.uid()
    )
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

COMMENT ON FUNCTION public.search_messages IS 'Search messages with workspace membership check, optional date range, author, and channel filters.';
