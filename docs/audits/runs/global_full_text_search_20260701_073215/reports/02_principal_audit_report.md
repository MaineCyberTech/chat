# Principal Audit Report

- Prompt: **global_full_text_search**
- Domain: **features**
- Run ID: **global_full_text_search_20260701_073215**
- Generated: **2026-07-01T07:32:14Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **2**
- P2: **3**, P3: **1**
- Readiness: **46.00**

## Findings

### P1 — search_messages RPC has no ts_rank relevance scoring — results not ordered by relevance

- **File:** `supabase/migrations/20260625000005_create_search.sql`
- **Category:** query_performance
- **Impact:** Search results are ordered by created_at rather than relevance; users see older/less relevant matches first
- **Fix:** Update search_messages RPC to use ts_rank(tsvector, tsquery) for relevance scoring, order by rank DESC, created_at DESC as tiebreaker

### P1 — Search API has no date range filter, author filter, channel filter, or pagination cursor

- **File:** `apps/api/src/modules/messages/routes.ts`
- **Category:** api_design
- **Impact:** Users cannot narrow search by date, author, or channel; no pagination for large result sets
- **Fix:** Extend search endpoint: add query params for date_from, date_to, author_id, channel_id (array), workspace_id; add cursor-based pagination

### P2 — No file/attachment metadata indexed in search — file names and descriptions not searchable

- **File:** ``
- **Category:** index_schema
- **Impact:** File search requires separate indexing or storage-level search; users cannot find files by name
- **Fix:** Add file_metadata table with searchable name/description columns; include in tsvector index or create separate search index

### P2 — Search RPC uses SECURITY INVOKER but still has potential to leak channel visibility if auth.uid() is NULL (anon client)

- **File:** ``
- **Category:** permissions
- **Impact:** Cross-channel search visibility relies on correct client; using anon client bypasses membership filter
- **Fix:** Fix search route to use req.supabase (JWT client) instead of getSupabase() — addresses existing P0 finding

### P2 — Search UI shows flat results with no date range or channel filter controls

- **File:** `apps/web/components/search/`
- **Category:** api_design
- **Impact:** Search UX is limited — users cannot filter results by date, channel, or author from the UI
- **Fix:** Add search filter bar: date range picker, channel multi-select dropdown, author autocomplete; add result type indicators (message vs file)

### P3 — No search performance benchmarks — no baseline for tsvector query latency under load

- **File:** ``
- **Category:** test_plan
- **Impact:** Search performance regressions go undetected as content grows
- **Fix:** Create search performance test: measure p50/p95/p99 latency for common search patterns with varying result sizes
