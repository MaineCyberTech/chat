# Principal Audit Report

- Prompt: **api_realtime_contract_audit**
- Domain: **api**
- Run ID: **api_realtime_contract_audit_20260708_073508**
- Generated: **2026-07-08T12:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **4**
- P2: **5**, P3: **2**
- Readiness: **73.00**

## Findings

### P1 — Socket.io events have no per-event authorization after initial connection auth

- **File:** `apps/api/src/lib/socket.ts`
- **Category:** realtime_contract
- **Impact:** After socket auth, events like typing:start, typing:stop, channel:join, channel:leave, presence:set can be emitted for any channel/user without verifying membership. A malicious client could spam typing indicators on arbitrary channels or spoof presence updates for other users
- **Fix:** Add per-event authorization middleware or checks: verify workspace membership on channel:join/channel:leave, verify the emitting user matches the claimed userId on presence:set. For typing events, verify the user is a member of the target channel's workspace

### P1 — Presence state flickers offline→online on every reconnect (no graceful reconnect window)

- **File:** `apps/api/src/lib/socket.ts`
- **Category:** realtime_contract
- **Impact:** On every disconnect/reconnect, presence toggles from online→offline→online in rapid succession. Other users see the user flicker offline briefly, causing confusion and unnecessary UI updates. Active users may appear briefly offline to others during network hiccups
- **Fix:** Add a disconnect grace period (e.g., 30s delay before setting presence to offline). Use a 'last_seen_at' timestamp updated on heartbeat, and only mark offline after the grace period expires without a new heartbeat. Socket events should emit presence:away during the grace window instead of offline

### P1 — No API versioning mechanism beyond static /v1 prefix — consumers cannot negotiate versions

- **File:** `apps/api/src/route-registry.ts`
- **Category:** rest_contract
- **Impact:** Breaking changes to API payloads or response shapes cannot be rolled out gracefully. All consumers are forced to update simultaneously or break. No Accept-Version header, no Content-Type version negotiation, no deprecation timeline header on existing endpoints
- **Fix:** Add Accept-Version header support for content negotiation, implement a Sunset or Deprecation header on old versions, and document the versioning strategy (URL-path vs header-based)

### P1 — No server-side deduplication for socket event delivery on reconnect — clients may receive duplicate events

- **File:** `apps/api/src/lib/socket.ts`
- **Category:** realtime_contract
- **Impact:** Socket.io's default behavior can deliver buffered events on reconnect. Without server-side event IDs and dedup markers, clients may process duplicate message:new, message:updated, or presence:update events, causing duplicate UI entries and confusion
- **Fix:** Assign monotonic event IDs to critical events (message:new, message:updated, message:deleted). Track last-received event ID per-socket and skip events already delivered. Client-side should already handle dedup via message ID

### P2 — No rate limiting on socket events after authentication

- **File:** `apps/api/src/lib/socket.ts`
- **Category:** realtime_contract
- **Impact:** Once a socket is authenticated, events like typing:start, channel:join, channel:leave have no per-user rate limiting. A compromised or malicious client can flood the server with events, causing excessive DB writes and broadcast storms to all connected clients
- **Fix:** Implement per-user rate limiting on socket events (e.g., max 10 typing events per second per user, max 5 channel joins per second). Use an in-memory counter with sliding window per userId

### P2 — Inconsistent pagination approaches — cursor-based for message listing, offset-based for search and other endpoints

- **File:** `apps/api/src/modules/messages/routes.ts`
- **Category:** pagination
- **Impact:** Cursor-based pagination (message listing) and offset-based pagination (search, channels, admin endpoints) create two different client pagination patterns, increasing frontend complexity. Offset-based pagination also has well-known issues with data shifting during page navigation
- **Fix:** Standardize on cursor-based pagination for all list endpoints. For admin/export endpoints where offset is acceptable, document the tradeoffs. Implement a shared pagination utility that supports both cursor and offset modes

### P2 — Webhook GET /webhooks requires workspace_id query param but PATCH /webhooks/:id uses URL param — inconsistent resource identification

- **File:** `apps/api/src/modules/webhooks/routes.ts`
- **Category:** rest_contract
- **Impact:** The workspace_id query param pattern for GET /webhooks is inconsistent with the URL-based resource identification used by other endpoints (PATCH, DELETE). This creates confusion for API consumers and SDK authors who expect consistent resource addressing
- **Fix:** Move GET /webhooks to /workspaces/:workspaceId/webhooks path, or accept workspace_id in both query param and URL param consistently. Document the workspace scoping pattern clearly

### P2 — Admin and regular modules both define /webhooks/deliveries route — potential route collision

- **File:** `apps/api/src/modules/admin/routes.ts`
- **Category:** rest_contract
- **Impact:** Both admin/routes.ts and webhooks/routes.ts define GET /webhooks/deliveries. Depending on route registration order in route-registry.ts, one may shadow the other. The admin version is for super-users while the regular version uses workspace_id query param — clients may hit the wrong endpoint
- **Fix:** Prefix admin webhook routes with /admin (e.g., /v1/admin/webhooks/deliveries) to avoid collision. The admin route is already mounted at /v1/admin, so this may be fine — but verify route precedence and document both endpoints

### P2 — Reactions batch endpoint lacks authentication on the user — no requireMessageAccess middleware

- **File:** `apps/api/src/modules/reactions/routes.ts`
- **Category:** rest_contract
- **Impact:** GET /reactions/batch has no requireMessageAccess middleware — any authenticated user can query reactions for any set of message IDs without verifying channel membership. Could leak channel conversation patterns via reaction presence
- **Fix:** Add requireMessageAccess validation for each message ID, or restrict the batch endpoint to only return reactions for messages the user can access

### P3 — GDPR export returns full message content as raw JSON download with no encryption or expiry

- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** rest_contract
- **Impact:** The GDPR data export endpoint returns a downloadable JSON containing all user messages, notifications, preferences, and push subscription data. The download link has no authentication after the initial request and no expiry — if intercepted, all user data is exposed
- **Fix:** Generate a short-lived signed URL (e.g., 5 minutes) for the export, or stream the response directly with proper Content-Disposition headers already implemented. Consider encrypting the export payload at rest

### P3 — Pagination helper silently caps limit at maxLimit without notifying the caller

- **File:** `apps/api/src/lib/pagination.ts`
- **Category:** rest_contract
- **Impact:** When a client requests a limit larger than maxLimit, the value is silently capped. The response doesn't indicate the original requested value vs actual limit, which can confuse API consumers about pagination behavior
- **Fix:** Include both requested_limit and actual_limit in paginated responses, or return a warning header when the limit is capped
