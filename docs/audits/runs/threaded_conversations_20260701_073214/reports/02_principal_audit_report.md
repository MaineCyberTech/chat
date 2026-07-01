# Principal Audit Report

- Prompt: **threaded_conversations**
- Domain: **features**
- Run ID: **threaded_conversations_20260701_073214**
- Generated: **2026-07-01T07:32:14Z**
- Decision: **NO-GO**
- P0: **2**, P1: **2**
- P2: **2**, P3: **1**
- Readiness: **30.00**

## Findings

### P0 — No thread_metadata table — reply_count, participant_count, last_activity_at, view_count not tracked

- **File:** `supabase/migrations/`
- **Category:** schema_design
- **Impact:** Thread list cannot show reply counts, sort by activity, or track participant engagement
- **Fix:** Create thread_metadata table: id (PK = message_id), reply_count INT DEFAULT 0, participant_count INT DEFAULT 0, last_activity_at TIMESTAMPTZ, view_count INT DEFAULT 0

### P0 — Thread panel has no thread participant tracking, no join/leave semantics, no thread unread counts, no participant list

- **File:** `apps/web/components/chat/thread-panel.tsx`
- **Category:** frontend_ux
- **Impact:** Thread UX is basic — users cannot see who is in a thread or control thread participation
- **Fix:** Add thread participants sidebar, join/leave buttons, thread unread badge, participant count display

### P1 — No thread_participants table — cannot track who has joined/left a thread for notification routing

- **File:** `supabase/migrations/`
- **Category:** schema_design
- **Impact:** Thread notifications must go to all workspace members instead of thread participants only
- **Fix:** Create thread_participants table: thread_id FK, user_id FK, joined_at, last_read_at TIMESTAMPTZ. Unique (thread_id, user_id)

### P1 — No thread-specific API endpoints — no get thread participants, join thread, leave thread, get thread unread count

- **File:** `apps/api/src/modules/messages/routes.ts`
- **Category:** api_contract
- **Impact:** Frontend cannot manage thread participation or display thread-specific state
- **Fix:** Add API endpoints: GET /threads/:id, POST /threads/:id/join, POST /threads/:id/leave, GET /threads/:id/unread

### P2 — No thread-specific realtime events — thread:reply, thread:participant_joined, thread:participant_left

- **File:** `apps/api/src/lib/socket.ts`
- **Category:** realtime
- **Impact:** Thread updates not pushed in real-time; clients must poll
- **Fix:** Add socket events: thread:reply (with parent context), thread:participant_joined, thread:participant_left

### P2 — No thread indicator on messages that have threads — no reply count badge, no thread preview

- **File:** `apps/web/components/chat/message-list.tsx`
- **Category:** frontend_ux
- **Impact:** Users cannot see which messages have active threads without clicking each one
- **Fix:** Add thread reply count badge, last reply preview text, and click-to-open-thread on message

### P3 — No thread-specific tests — no E2E for thread creation, reply, join/leave, unread counts, realtime sync

- **File:** ``
- **Category:** test_plan
- **Impact:** Thread feature will ship without automated regression coverage
- **Fix:** Write tests: create thread via reply API, fetch thread participants, join/leave, verify unread counts, verify realtime events
