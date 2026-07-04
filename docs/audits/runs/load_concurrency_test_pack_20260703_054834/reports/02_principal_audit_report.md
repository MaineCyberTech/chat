# Principal Audit Report

- Prompt: **load_concurrency_test_pack**
- Domain: **testing**
- Run ID: **load_concurrency_test_pack_20260703_054834**
- Generated: **2026-07-03T14:00:00Z**
- Decision: **NO-GO**
- P0: **1**, P1: **2**
- P2: **1**, P3: **0**
- Readiness: **10.00**

## Findings

### P0 — Existing k6 tests only exercise the /healthz endpoint — zero load tests exist for message send, socket connect, search, or notification paths
- **File:** `tests/k6/smoke-test.js`
- **Category:** load_test_coverage
- **Impact:** No load testing data exists for the core chat send path (POST /messages), WebSocket connection churn (socket.io reconnect storms), search queries (search_messages RPC), or notification delivery. Production capacity assumptions are entirely unverified.
- **Fix:** Add k6 scenarios for: (1) POST /messages concurrent sends with dedup verification, (2) Socket.IO connection burst (1000 concurrent connects with immediate channel:join), (3) search_messages RPC under concurrent load, (4) notification delivery burst. Define success criteria for each scenario.

### P1 — Notification fanout (e.g., @everyone or channel join notifications) blocks the message send handler sequentially
- **File:** `apps/api/src/modules/notifications/service.ts`
- **Category:** notification_throughput
- **Impact:** A single @everyone mention triggers sequential notification sends to every workspace member. With 500 members, this blocks the message handler for seconds. Under concurrent sends, this creates a compounding delay as each request waits for previous notification fanout to complete.
- **Fix:** Move notification fanout to a background job queue. Replace await notificationService.sendBatch() with queue.add('send_notifications', { payload }). Implement a worker that processes notifications with a concurrency limit of 10-20 parallel deliveries.

### P1 — Idempotency key store uses in-memory Map with no eviction or size limit — unbounded memory growth under load
- **File:** `apps/api/src/lib/idempotency.ts`
- **Category:** idempotency_memory
- **Impact:** The idempotency Map stores every idempotency key indefinitely with 24h TTL. Under load test with 10K+ concurrent requests, the Map grows without bound, eventually causing OOM or increased GC pressure affecting all request latency.
- **Fix:** Add Map eviction: use a LimitedMap class that caps entries (e.g., 10,000) and evicts oldest entries. Implement periodic cleanup interval. Add memory usage monitoring to the /metrics endpoint.

### P2 — No latency histograms or percentile tracking for critical API endpoints (messages, search, socket)
- **File:** `apps/api/src/lib/metrics.ts`
- **Category:** metrics_for_load
- **Impact:** During load tests, operators can only see request counts and error rates, not P50/P95/P99 latency. Without latency percentiles, capacity planning is based on averages that mask tail latency problems from GC pauses or lock contention.
- **Fix:** Add Histogram metrics for: message_send_duration_ms, message_list_duration_ms, search_duration_ms, socket_connect_duration_ms. Use prometheus Histogram buckets appropriate for each endpoint (e.g., 10ms-5000ms range).
