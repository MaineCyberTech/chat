# Principal Audit Report

- Prompt: **api_realtime_contract_audit**
- Domain: **api**
- Run ID: **api_realtime_contract_audit_20260701_071112**
- Generated: **2026-07-01T07:11:05Z**
- Decision: **NO-GO**
- P0: **2**, P1: **5**
- P2: **4**, P3: **3**
- Readiness: **35.00**

## Findings

### P0 — Reaction routes have no workspace/channel membership check

- **File:** `apps/api/src/modules/reactions/routes.ts`
- **Category:** contract_drift
- **Impact:** Any authenticated user can read/add/remove reactions on any message across any workspace
- **Fix:** Add requireChannelAccess middleware to GET/POST/DELETE /messages/:id/reactions and GET /reactions/batch

### P0 — Feature-flag routes have broken middleware — requireWorkspaceMembership("workspaceId") on paths without :workspaceId param

- **File:** `apps/api/src/modules/feature-flags/routes.ts`
- **Category:** contract_drift
- **Impact:** All feature-flag requests will fail with 400 "Missing workspaceId" — feature flags are non-functional
- **Fix:** Remove requireWorkspaceMembership from feature-flag routes or add workspaceId as a query/body parameter

### P1 — Message search uses getSupabase() (anon client) instead of req.supabase (JWT client)

- **File:** `apps/api/src/modules/messages/routes.ts`
- **Category:** contract_drift
- **Impact:** auth.uid() is NULL in SECURITY INVOKER search function — cross-tenant search possible or no results returned
- **Fix:** Replace getSupabase() with req.supabase in messages/routes.ts line 38

### P1 — No Socket.io connection state recovery — clients lose all room state on disconnect

- **File:** `apps/api/src/lib/socket.ts`
- **Category:** realtime_behavior
- **Impact:** After reconnect, clients must manually re-join rooms and re-fetch state; messages may be lost during disconnect window
- **Fix:** Enable connectionStateRecovery in Socket.io server config; implement room membership persistence

### P1 — No per-event authorization after initial Socket.io auth handshake

- **File:** `apps/api/src/lib/socket.ts`
- **Category:** realtime_behavior
- **Impact:** Any connected client can join any channel room by emitting channel:join with any channelId
- **Fix:** Add per-event membership check in channel:join handler before adding socket to room

### P1 — In-memory idempotency fallback has no size limit or eviction policy

- **File:** `apps/api/src/lib/idempotency.ts`
- **Category:** contract_drift
- **Impact:** Unbounded memory growth under high request volume — potential OOM
- **Fix:** Add Map size limit with LRU eviction to in-memory fallback

### P1 — GET /webhooks reads workspace_id from query param but middleware checks req.params — workspace validation broken

- **File:** `apps/api/src/modules/webhooks/routes.ts`
- **Category:** contract_drift
- **Impact:** Webhook listing bypasses workspace membership check
- **Fix:** Create a middleware that reads from req.query.workspace_id instead of req.params.workspaceId

### P2 — Message upload endpoint has no channel/workspace membership check

- **File:** `apps/api/src/modules/messages/routes.ts`
- **Category:** contract_drift
- **Impact:** Any authenticated user can upload files without channel context
- **Fix:** Add channel_id to upload payload and requireChannelAccess middleware

### P2 — Workspace member list returns email field — PII exposure

- **File:** `apps/api/src/modules/workspaces/service.ts`
- **Category:** contract_drift
- **Impact:** Workspace members can see each other's email addresses unnecessarily
- **Fix:** Remove email from SELECT query in getMembers(), return only display_name and avatar_url

### P2 — Channel slug dedup loop has no max attempt safety limit

- **File:** `apps/api/src/modules/channels/service.ts`
- **Category:** contract_drift
- **Impact:** Infinite loop if all slug variants are taken — potential hang/DoS
- **Fix:** Add MAX_ATTEMPTS=100 guard similar to workspace slug dedup

### P2 — Cursor pagination has no input validation — malformed cursor could cause unexpected query behavior

- **File:** `apps/api/src/modules/messages/service.ts`
- **Category:** realtime_behavior
- **Impact:** Malformed cursor could lead to SQL injection-like behavior via .or() filter
- **Fix:** Validate cursor format (two parts separated by |) before using in query

### P3 — Uses console.error instead of structured logger.error for push notification failures

- **File:** `apps/api/src/modules/notifications/service.ts`
- **Category:** contract_drift
- **Impact:** Push notification failures not captured in structured logging; harder to alert/diagnose
- **Fix:** Replace console.error with logger.error

### P3 — Consent routes use lowercase error.message format inconsistent with uppercase error.code convention

- **File:** `apps/api/src/modules/consent/routes.ts`
- **Category:** contract_drift
- **Impact:** Inconsistent API contract — clients must handle two error formats
- **Fix:** Standardize consent error responses to use error.code uppercase convention

### P3 — Idempotency-Key header has no format validation

- **File:** `apps/api/src/config/validators.ts`
- **Category:** contract_drift
- **Impact:** Any string accepted — potential abuse with very long keys
- **Fix:** Add UUID or length validation for idempotency-key header
