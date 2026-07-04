# Principal Audit Report

- Prompt: **global_full_text_search**
- Domain: **features**
- Run ID: **global_full_text_search_20260703_055339**
- Generated: **2026-07-03T12:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **1**
- P2: **2**, P3: **0**
- Readiness: **67.50**

## Findings

### P1 — Author filter requires raw UUID input with no user autocomplete or display-name mapping

- **File:** `apps/web/components/chat/search-bar.tsx:221`
- **Category:** frontend_ux
- **Impact:** Users must know or look up workspace member UUIDs to filter by author; severely impacts usability.
- **Fix:** Replace UUID text input with a user-picker dropdown showing workspace member names/avatars; send selected UUID to API.

### P2 — No file or attachment metadata search — search_messages RPC indexes only the content column of messages

- **File:** `supabase/migrations/20260627000003_enhanced_search.sql`
- **Category:** search_coverage
- **Impact:** Users cannot search for messages by attached file name, description, or upload metadata.
- **Fix:** Add a separate file_search RPC that searches file_attachments.name and file_attachments.description.

### P2 — Search results use a hard result_limit=20 with no cursor or offset-based pagination

- **File:** `apps/api/src/modules/messages/routes.ts:45`
- **Category:** pagination
- **Impact:** Only the top 20 results are returned; results beyond the first page are inaccessible.
- **Fix:** Add cursor-based pagination (created_at + id) to the search_messages RPC parameters and API endpoint.
