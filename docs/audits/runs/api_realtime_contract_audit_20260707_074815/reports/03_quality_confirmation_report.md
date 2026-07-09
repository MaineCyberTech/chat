# Quality Confirmation Report

- Prompt: **api_realtime_contract_audit**
- Domain: **api**
- Run ID: **api_realtime_contract_audit_20260707_074815**
- Generated: **2026-07-07T12:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **2**, P1: **5**
- P2: **8**, P3: **6**
- Readiness: **64.50**

## Findings

### P0 — Socket.io client tear-down on every getSocket() call destroys all listeners and reconnects, causing duplicate message delivery and lost presence state

- **File:** `apps/web/lib/socket.ts`
- **Category:** realtime
- **Impact:** Each getSocket() call removes all listeners, disconnects, and reconnects. Multiple React components calling getSocket() simultaneously will create connection storms. Messages sent during reconnection are lost. Presence state is reset on every reconnect.
- **Fix:** Implement singleton socket with reconnect buffer (queue messages during disconnect, replay on connect). Add message deduplication by idempotency-key. Initialize socket once at app mount, not per-component.

### P0 — Socket channel:join only checks workspace membership, not private channel membership, allowing unauthorized channel access

- **File:** `apps/api/src/lib/socket.ts`
- **Category:** realtime
- **Impact:** Any workspace member can join any private channel's real-time room via socket, bypassing private channel access controls enforced in REST API.
- **Fix:** Add channel membership check (channel.is_private => channel_members lookup) in the channel:join handler, matching requireChannelAccess middleware logic.

### P1 — Reactions (add/remove) do not broadcast via Socket.io; frontend never receives real-time reaction updates

- **File:** `apps/api/src/modules/reactions/routes.ts`
- **Category:** realtime
- **Impact:** Users won't see reactions appear/ disappear in real time. Requires manual re-fetch or page reload, breaking the chat real-time experience. Frontend teams may add polling workarounds.
- **Fix:** Emit reaction:added and reaction:removed events via Socket.io (getIO().to(channelRoom).emit(...)) in ReactionService.add and ReactionService.remove.

### P1 — Channel mutations (create, update, delete, member add/remove) do not broadcast via Socket.io

- **File:** `apps/api/src/modules/channels/service.ts`
- **Category:** realtime
- **Impact:** Frontend won't see new channels, renamed channels, or member changes in real-time unless polling. Users remain in deleted channels. Sidebar doesn't update.
- **Fix:** Emit channel:created, channel:updated, channel:deleted, channel:member_added, channel:member_removed events via Socket.io in ChannelService.

### P1 — Dual response format: AppError.toJSON() returns { error: { code, message } } while failure() envelope returns { success: false, error: { code, message, status } } causing client contract confusion

- **File:** `apps/api/src/middleware/error-handler.ts`
- **Category:** response_consistency
- **Impact:** Frontend code must handle two different error response shapes based on ?envelope=true query param that most clients never send. This creates fragile error handling and potential uncaught errors.
- **Fix:** Standardize on a single error response format. Remove the ?envelope flag. Make error-handler always use the AppError.toJSON() format or always use the failure() format.

### P1 — Inconsistent success response shapes: some endpoints return { success: true }, others return the resource directly, others return { message }, { messages }, { channel }, etc.

- **File:** `apps/api/src/modules`
- **Category:** response_consistency
- **Impact:** Frontend SDK and client code must handle multiple response shapes. Adding new endpoints requires checking which shape to use. Swagger/OpenAPI spec becomes inaccurate.
- **Fix:** Adopt a single response envelope: either always wrap in { data: <resource> } or always return the resource directly. Audit all 21 route modules for consistency.

### P1 — Idempotency only implemented for message creation; all other state-changing POST/PATCH/DELETE endpoints lack idempotency support

- **File:** `apps/api/src/lib/idempotency.ts`
- **Category:** idempotency
- **Impact:** Network retries can cause duplicate channel creates, webhook creates, reaction adds, workspace creates, etc. No safe retry mechanism exists.
- **Fix:** Implement idempotency middleware that checks Idempotency-Key header globally for all mutating endpoints. In-memory fallback is not suitable for multi-instance deployments.

### P2 — Double-submit cookie CSRF uses timingSafeEqual with two user-controlled values, but the cookie token is stored without httpOnly flag, making it readable via JS

- **File:** `apps/api/src/middleware/csrf.ts`
- **Category:** security_middleware
- **Impact:** The CSRF cookie is accessible to JavaScript (httpOnly: false), weakening CSRF protection. An XSS vulnerability would give full access to CSRF tokens.
- **Fix:** Set httpOnly: true on the CSRF cookie. Use a separate non-httpOnly cookie or header-based approach for the client-side token value.

### P2 — Several route modules use inline validation (manual checks) instead of Zod schemas, bypassing the centralized validation layer

- **File:** `apps/api/src/validators`
- **Category:** validation
- **Impact:** Inconsistent validation across endpoints. Missing schema documentation. Some endpoints accept raw input without type checking (e.g., sidebar routes, groups routes, livekit routes).
- **Fix:** Create Zod schemas for all remaining endpoints (sidebar-categories, groups, scheduled-posts, consent, status, etc.) and use safeParse uniformly.

### P2 — Thread join/leave/participants endpoints lack membership checks; any authenticated user can access any thread's participant list or join any thread

- **File:** `apps/api/src/modules/threads/routes.ts`
- **Category:** authorization
- **Impact:** User could enumerate thread participants across the entire platform. Could join threads in channels they don't have access to.
- **Fix:** Add requireChannelAccess middleware to thread endpoints (resolve channel from thread parent message).

### P2 — User group routes lack workspace membership checks; any authenticated user can create/modify groups in any workspace

- **File:** `apps/api/src/modules/groups/routes.ts`
- **Category:** authorization
- **Impact:** Authenticated user could create user groups in workspaces they don't belong to, or add/remove members from groups in any workspace.
- **Fix:** Add requireWorkspaceMembership middleware to all group routes. Validate workspace ownership.

### P2 — GET /workspaces/:workspaceId/channels and GET /channels/:id/members have no pagination, risking memory exhaustion on large workspaces

- **File:** `apps/api/src/modules/channels/routes.ts`
- **Category:** pagination
- **Impact:** Workspace with thousands of channels or millions of members will cause out-of-memory errors or slow responses. No way to progressively load.
- **Fix:** Add cursor-based or offset-based pagination to channel listing and member listing endpoints. Add default limit with max cap.

### P2 — queryWithTimeout uses Promise.race which doesn't abort the underlying operation, causing resource leaks on timeout

- **File:** `apps/api/src/lib/db-timeout.ts`
- **Category:** performance
- **Impact:** When a query times out, the underlying Supabase fetch and database query continue executing. For long-running queries this wastes database connections and API server memory.
- **Fix:** Pass AbortSignal to Supabase queries via the fetch implementation's Signal. Use AbortController to actually terminate in-flight requests on timeout.

### P2 — Frontend has its own HTTP client (api.ts) that duplicates SDK logic, with different error handling, CSRF management, and response parsing than the @chat/sdk package

- **File:** `apps/web/lib/api.ts`
- **Category:** contract_drift
- **Impact:** Two code paths for API calls that can diverge. SDK adds /v1 prefix automatically but api.ts also does. Error handling differs (SDK throws structured errors, api.ts throws plain Errors). OpenAPI spec may match neither.
- **Fix:** Consolidate all API client usage into @chat/sdk. Remove duplicate api.ts or make it a thin wrapper around the SDK client.

### P2 — OpenAPI spec loaded from static JSON file with no automated sync; likely out of date with actual routes and schemas

- **File:** `apps/api/src/modules/openapi/routes.ts`
- **Category:** contract_drift
- **Impact:** API consumers relying on OpenAPI spec will encounter undocumented endpoints, incorrect schemas, and wrong response shapes. Spec falls back to empty paths if file missing in production.
- **Fix:** Generate OpenAPI spec dynamically from route registry and Zod schemas (e.g., using zod-to-openapi). Add CI check that verifies spec matches routes.

### P3 — Error handler exposes stack traces in development mode via NODE_ENV check, but stack traces may contain file paths or internal structure

- **File:** `apps/api/src/middleware/error-handler.ts`
- **Category:** error_handling
- **Impact:** Internal file paths and code structure may leak in development environments. Minor info disclosure risk.
- **Fix:** Use a configuration flag rather than NODE_ENV check for stack trace exposure. Never expose stack traces in error responses.

### P3 — No API version negotiation or version pinning strategy beyond a single /v1 prefix; no sunset/deprecation headers

- **File:** `apps/api/src/route-registry.ts`
- **Category:** api_versioning
- **Impact:** Breaking API changes cannot be rolled out gracefully. Consumers have no way to pin versions or get deprecation warnings.
- **Fix:** Add Accept-Version header support or URL-based versioning (v2). Add Sunset and Deprecation response headers. Create a version migration guide.

### P3 — Graceful shutdown destroys all sockets immediately without draining in-flight requests first

- **File:** `apps/api/src/server.ts`
- **Category:** resilience
- **Impact:** In-flight HTTP requests and WebSocket messages are terminated mid-processing. Users may see partial updates or failed message sends during deployment.
- **Fix:** Add draining phase: stop accepting new requests, wait for active requests to complete (with timeout), then destroy idle sockets. Use httpServer.close() callback properly.

### P3 — Basic health endpoint (GET /) returns hardcoded status without checking database or Redis connectivity

- **File:** `apps/api/src/modules/health/service.ts`
- **Category:** monitoring
- **Impact:** Health check passes even when database is unreachable. Load balancer/ orchestrator won't detect degraded state.
- **Fix:** Remove basic health endpoint or add dependency health checks. Use getFullHealth() as the primary health endpoint. Add Redis ping check.

### P3 — Webhook create schema allows optional secret field but stores it in plaintext in the database

- **File:** `apps/api/src/modules/webhooks/routes.ts`
- **Category:** webhook_security
- **Impact:** Webhook secrets are stored as plaintext in the webhook_endpoints table. Database compromise would expose all webhook signing secrets.
- **Fix:** Hash webhook secrets at rest using a KDF (e.g., bcrypt/argon2). Only return masked versions in API responses.

### P3 — Socket.io client library installed but frontend has no app-level socket lifecycle management; socket only initialized lazily in use-presence hook

- **File:** `apps/web/lib/socket.ts`
- **Category:** maintenance
- **Impact:** Real-time features like typing indicators, new message notifications, and channel updates don't work via Socket.io. The library exists but is effectively dead code for the main chat experience.
- **Fix:** Create a SocketProvider context that initializes the socket at app root. Connect socket lifecycle to auth state (connect on login, disconnect on logout).
