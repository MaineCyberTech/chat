# Quality Confirmation Report

- Prompt: **final_full_repo_deep_dive_quality_confirmation**
- Domain: **audit**
- Run ID: **final_full_repo_deep_dive_quality_confirmation_20260703_062611**
- Generated: **2026-07-03T06:30:00Z**
- Decision: **NO-GO**
- P0: **3**, P1: **2**
- P2: **4**, P3: **1**
- Readiness: **0.00**

## Findings

### P0 — Webhook payload processing has no size validation before parsing — an attacker can send a multi-GB JSON payload that exhausts API server memory

- **File:** `apps/api/src/modules/webhooks/service.ts`
- **Category:** Input Validation
- **Impact:** Unbounded webhook payload parsing is a trivial denial-of-service vector. API can be OOM-killed by any authenticated user with webhook access.
- **Fix:** Add payload size check before JSON.parse (max 1MB). Return 413 Payload Too Large if exceeded.

### P0 — Message editing has no optimistic locking — two concurrent PATCH requests can overwrite each other without detecting the conflict. The `updated_at` timestamp is the only version field but it's never checked in the WHERE clause.

- **File:** `apps/api/src/modules/messages/service.ts`
- **Category:** Data Integrity
- **Impact:** Lost update problem: if Alice edits a message while Bob also edits the same message, one edit silently overwrites the other. No version/etag checking.
- **Fix:** Add a `version` column (integer) to messages table. PATCH must include version, WHERE clause checks it, increment on success. Return 409 Conflict if stale.

### P0 — Same optimistic locking gap exists for channel PATCH — no version check, concurrent updates can silently overwrite

- **File:** `apps/api/src/modules/channels/service.ts`
- **Category:** Data Integrity
- **Impact:** Same lost update vulnerability as messages.
- **Fix:** Add version column to channels table with same conflict detection pattern.

### P1 — getSupabase() creates a new Supabase client on every call with no connection pooling or reuse — the client object is stateless but instantiation overhead and configuration is repeated

- **File:** `apps/api/src/lib/supabase.ts`
- **Category:** Error Handling
- **Impact:** Each call to getSupabase() creates a fresh client. While the underlying Supabase client uses HTTP keep-alive, the wrapping and retry configuration is duplicated. Minor performance concern that becomes significant under load.
- **Fix:** Create supabase client once at module level (singleton pattern). getSupabase() just returns the singleton.

### P1 — Socket.io rate limiting is per-server in-memory (Map) — does not work across multiple API instances behind a load balancer

- **File:** `apps/api/src/lib/socket.ts`
- **Category:** Concurrency
- **Impact:** With horizontal scaling, rate limits reset per instance. A client can make 10x the intended connections by distributing across instances.
- **Fix:** Move Socket.io rate limiting to Redis or use the same Redis adapter for rate limit state.

### P2 — Webhook delivery (POST /webhooks/:id/deliver) has no timeout — if the target server hangs, the API handler hangs indefinitely holding a connection

- **File:** `apps/api/src/modules/webhooks/routes.ts`
- **Category:** Error Handling
- **Impact:** A single hanging webhook delivery can exhaust the API's connection pool, cascading to all other requests.
- **Fix:** Add fetch timeout (e.g. 10s via AbortController) to webhook delivery HTTP requests.

### P2 — Auth, channels, webhooks, notifications, consent modules emit zero business metrics (counters, histograms, gauges). Only the general middleware (rate-limit, request-id) has been instrumented with Prometheus via the metrics lib.

- **File:** `apps/api/src/modules/`
- **Category:** Metrics
- **Impact:** No visibility into auth success/failure rates, channel creation rates, webhook delivery latency, notification delivery rates. Business observability is blind.
- **Fix:** Add Prometheus counters/histograms to each module's key operations following the pattern in lib/metrics.ts

### P2 — All notification endpoints (GET /notifications, PATCH /notifications/:id/read, POST /notifications/read-all) lack explicit authorization middleware — they rely on req.supabase RLS but have no route-level access control

- **File:** `apps/api/src/modules/notifications/`
- **Category:** Authorization
- **Impact:** While RLS provides database-level protection, the lack of route-level middleware is inconsistent with other modules and may mask auth gaps if RLS policies are incorrect.
- **Fix:** Add requireAuth middleware to all notification routes for defense-in-depth consistency.

### P2 — Consent routes (POST /consent, GET /consent, GET /consent/preferences) have no authorization middleware — they assume req.userId is always set

- **File:** `apps/api/src/modules/consent/routes.ts`
- **Category:** Authorization
- **Impact:** If the authenticate middleware fails silently (no session), req.userId is undefined. Consent operations would fail with opaque errors.
- **Fix:** Add requireAuth middleware to consent routes for consistency with other modules.

### P3 — Architecture docs reference the old cloud-init context (port 3000 vs 80 with Caddy) but are not fully updated to reflect the current reverse-proxy topology documented in AGENTS.md

- **File:** `docs/architecture/`
- **Category:** Documentation
- **Impact:** Architecture documentation lags behind actual infrastructure by 1-2 iterations. New team members get slightly incorrect mental model.
- **Fix:** Audit and update all 3 architecture docs files to match current Caddy-based routing topology.
