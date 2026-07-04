# Principal Audit Report

- Prompt: **threaded_conversations**
- Domain: **features**
- Run ID: **threaded_conversations_20260703_055337**
- Generated: **2026-07-03T12:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **1**
- P2: **2**, P3: **1**
- Readiness: **56.70**

## Findings

### P1 — GET /threads/:id/participants and POST /threads/:id/join lack requireChannelAccess middleware, relying solely on RLS for access control

- **File:** `apps/api/src/modules/threads/routes.ts:27`
- **Category:** thread_authorization
- **Impact:** Any authenticated user who can guess a thread_id can enumerate participants or join threads without verifying channel membership.
- **Fix:** Add requireChannelAccess middleware to the /threads/:id/participants and /threads/:id/join routes. Threads require resolving the parent message's channel_id first.

### P2 — Thread panel fetches data once on mount and does not subscribe to WebSocket events for real-time reply updates

- **File:** `apps/web/components/chat/thread-panel.tsx:62`
- **Category:** thread_realtime
- **Impact:** When a new reply arrives while the thread panel is open, the user sees stale data until they close and reopen.
- **Fix:** Add socket subscription in ThreadPanel for message:new events, filtering by parent_id === parentMessage.id. Insert new replies into the local replies list immediately.

### P2 — Thread unread counts are only computed on-demand with no real-time push or badge indicator in the message list

- **File:** `apps/api/src/modules/threads/service.ts:61`
- **Category:** thread_unread
- **Impact:** Users have no visual indicator that a thread they participated in has new replies.
- **Fix:** Emit a 'thread:unread_update' Socket event with {thread_id, count} when a new reply is created. Subscribe in the frontend message list to update per-message unread counts.

### P3 — Mobile thread panel uses animate-slide-in-right class but no keyframe animation is defined in CSS — panel appears/disappears instantly

- **File:** `apps/web/components/chat/chat-view.tsx:478`
- **Category:** thread_ux
- **Impact:** The mobile thread transition is jarring rather than smooth.
- **Fix:** Define @keyframes slide-in-right and slide-out-right animations in globals.css. Use CSS transition or animation classes with proper timing.
