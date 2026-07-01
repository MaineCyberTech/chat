# Principal Audit Report

- Prompt: **feature_gap_architecture_inventory**
- Domain: **features**
- Run ID: **feature_gap_architecture_inventory_20260701_073214**
- Generated: **2026-07-01T07:32:14Z**
- Decision: **NO-GO**
- P0: **4**, P1: **3**
- P2: **2**, P3: **1**
- Readiness: **32.00**

## Findings

### P0 — Thread capability: parent_id exists in messages table (FK to self) but no thread metadata, participant tracking, reply count, or unread count

- **File:** `apps/api/src/modules/messages/service.ts`
- **Category:** existing_capability
- **Impact:** Threaded conversations require schema expansion: thread_metadata table, thread_participants table, thread_last_read tracking
- **Fix:** Status: PARTIAL. Add thread_metadata (reply_count, participant_count, last_activity_at), thread_participants, thread_last_read tables

### P0 — Notifications: basic CRUD + push exists, but NO @mention parsing, @role/@everyone, channel muting, or notification preferences

- **File:** `apps/api/src/modules/notifications/`
- **Category:** existing_capability
- **Impact:** Mention system is greenfield; notification engine needs rewrite for mention routing
- **Fix:** Status: PARTIAL. Add mention parsing pipeline, mention validation against membership, notification preference model per user

### P0 — Virtualization: NO virtual list, NO inverted scroll, NO windowing — all messages rendered as flat DOM

- **File:** `apps/web/components/chat/message-list.tsx`
- **Category:** missing_primitives
- **Impact:** Channels with 1000+ messages cause OOM; no infinite scroll capability
- **Fix:** Status: ABSENT. Must implement from scratch with @tanstack/react-virtual, inverted scroll, cursor pagination

### P0 — Rich text editor: plain textarea with NO markdown preview, NO @mention autocomplete, NO emoji picker, NO drag-drop

- **File:** `apps/web/components/chat/message-input.tsx`
- **Category:** missing_primitives
- **Impact:** Message input needs complete rewrite for rich editing
- **Fix:** Status: ABSENT. Must enhance textarea with mention autocomplete, emoji picker, drag-drop upload, markdown preview

### P1 — RBAC: owner/admin/member roles exist but NO channel-level overrides, NO custom roles, NO hidden channel support

- **File:** `apps/api/src/modules/workspaces/routes.ts`
- **Category:** existing_capability
- **Impact:** Granular RBAC requires schema + middleware + RLS redesign
- **Fix:** Status: PARTIAL. Add channel_role_overrides table, update middleware for override resolution, design RLS for hidden channels

### P1 — Search: full-text search exists with search_messages RPC but NO date range filter, NO file metadata search, NO relevance ranking

- **File:** `apps/api/src/modules/messages/`
- **Category:** existing_capability
- **Impact:** Search is functional but basic — lacks enterprise search capabilities
- **Fix:** Status: PARTIAL. Add ts_rank for relevance scoring, date range filter, file metadata indexing

### P1 — Incoming webhooks: NONE exist — only outgoing webhook delivery pipeline

- **File:** `apps/api/src/`
- **Category:** missing_primitives
- **Impact:** External systems cannot post to channels; greenfield feature
- **Fix:** Status: ABSENT. Design incoming webhook model with channel ownership, secret generation, payload formatting, rate limiting

### P2 — Optimistic UI: NO optimistic state system — all mutations wait for API response

- **File:** ``
- **Category:** missing_primitives
- **Impact:** UI feels slow; no instant-feedback pattern
- **Fix:** Status: ABSENT. Create optimistic state management with temporary IDs, rollback on failure, server-echo deduplication

### P2 — Multi-theme: light/dark only — NO slate dark, OLED high-contrast, or multi-theme architecture

- **File:** ``
- **Category:** missing_primitives
- **Impact:** Theme engine needs expansion for 4 named themes with SSR-safe hydration
- **Fix:** Status: PARTIAL. Expand CSS token system; implement SSR-safe theme hydration; add Slate Dark and OLED themes

### P3 — Audio/video media: NO WebRTC, NO media server, NO signaling channel, NO media grid — greenfield

- **File:** ``
- **Category:** missing_primitives
- **Impact:** Audio/video is last priority in roadmap but requires new infrastructure
- **Fix:** Status: ABSENT. Phase 3: evaluate LiveKit; design signaling; implement media grid
