# Principal Audit Report

- Prompt: **api_realtime_contract_audit**
- Domain: **api**
- Run ID: **api_realtime_contract_audit_20260716_060345**
- Generated: **2026-07-16T12:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **1**
- P2: **4**, P3: **2**
- Readiness: **6.50**

## Findings

### P1 — Reactions batch endpoint lacks message access control verification
- **File:** `apps/api/src/modules/reactions/routes.ts`
- **Category:** auth_scoping
- **Impact:** GET `/reactions/batch?message_ids=...` at line 24-41 accepts arbitrary message IDs without requiring message access. Any authenticated user can query reactions on messages in private channels they don't belong to, by guessing or enumerating message UUIDs.
- **Fix:** Apply access filtering: either add `requireMessageAccess` middleware for each ID or query only message IDs the user can access via channel membership join.

### P2 — No reconnect resync mechanism — clients can miss events during disconnect
- **File:** `apps/web/lib/socket.ts`
- **Category:** reconnect_behavior
- **Impact:** The frontend socket client at `apps/web/lib/socket.ts` implements reconnection with exponential backoff (lines 37-47) but has no mechanism to request missed events after reconnection. There is no `last_event_id` tracking, sequence number, or event replay endpoint. If a client disconnects for even a few seconds, messages sent during that window are permanently lost.
- **Fix:** Implement event sequence tracking: (1) add a monotonically increasing sequence number to broadcast events, (2) store `last_sequence` in client localStorage, (3) on reconnect, call a `/messages/since?seq=N` endpoint to replay missed events.

### P2 — Mixed pagination strategies — cursor-based for message list, offset-based for search
- **File:** `apps/api/src/modules/messages/routes.ts`
- **Category:** rest_schema
- **Impact:** `GET /channels/:channelId/messages` (line 89-103) uses cursor-based pagination while search and most other list endpoints use offset-based pagination. This inconsistency forces frontend to implement two pagination strategies and complicates caching.
- **Fix:** Consolidate on a single pagination strategy. Cursor-based is preferred for real-time feeds (avoids duplication on new insertions). Consider migrating search to cursor-based as well.

### P2 — DM channels list endpoint doesn't use channel access middleware — relies solely on RLS
- **File:** `apps/api/src/modules/channels/routes.ts`
- **Category:** rest_schema
- **Impact:** `GET /dm-channels` at line 248-255 lacks `requireChannelAccess` middleware. It uses `responseCache` but no authz middleware beyond `authenticate`, relying entirely on RLS for access control.
- **Fix:** Add `requireChannelAccess` middleware for defense-in-depth, or ensure the RLS policy on `dm_channels` is correct (currently scoped to `user1_id`/`user2_id` which is sufficient).

### P2 — Socket channel join verifies workspace membership but not private channel membership correctly
- **File:** `apps/api/src/lib/socket.ts`
- **Category:** realtime_payload
- **Impact:** The `channel:join` handler at line 155-212 checks workspace membership and private channel membership, but the RLS layer doesn't enforce private channel filtering for SELECT on channels/messages. This means a malicious client could bypass the socket-level check by reading channel data directly via Supabase.
- **Fix:** Fix the underlying RLS policies (see security audit) so both layers are aligned.

### P3 — Webhook enforceBodyLimit checks spoofable Content-Length header instead of actual body size
- **File:** `apps/api/src/modules/webhooks/routes.ts`
- **Category:** rest_schema
- **Impact:** The `enforceBodyLimit` middleware at line 20-29 reads `content-length` header which can be spoofed by an attacker. A request with small `content-length` header but large actual body would bypass the limit.
- **Fix:** Remove the middleware and rely on Express's `express.json({ limit: '1mb' })` which enforces actual body size after parsing.

### P3 — Socket broadcast for reactions fires asynchronously with no error propagation
- **File:** `apps/api/src/modules/reactions/routes.ts`
- **Category:** realtime_payload
- **Impact:** Reaction add/remove broadcasts at lines 65-80 and 101-116 use an IIFE with empty catch blocks (`catch { // Socket broadcast best-effort }`). Failure is silently swallowed, making debugging difficult when broadcasts fail.
- **Fix:** At minimum log the error: `catch (err) { logger.warn('Reaction broadcast failed', { error: String(err) }) }`
