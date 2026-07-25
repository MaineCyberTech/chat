# Worker Comprehensive Audit — July 24, 2026

**Scope**: Every worker processor, queue, scheduler, and library file — read in full.
**Files audited**: 15 source files, 1 Dockerfile, 1 env example, 2 compose configs.

---

## Executive Summary

| Severity | Count | Summary |
|----------|-------|---------|
| **P0**   | 4     | Search indexer Promise bug (silently corrupts tsvector), worker webhook dead letter never fires, Dockerfile exposes wrong port, compliance-export missing from centralized queue registry |
| **P1**   | 7     | No idempotency on in-app notif insert, CB never records success, reminders use setInterval (lost on crash), data retention default mismatches schedule, cleanup NOOP jobs wasting CPU, `SUPABASE_ANON_KEY` required by env schema but never used by worker, `withPerChannelRetry` retries permanent failures |
| **P2**   | 10    | Dead code `queues/index.ts`, dual webhook delivery systems diverge, CB in-memory only (no multi-worker sync), email recipient not validated before delivery attempt, `expose 4001 != 4100`, no shutdown drain for BullMQ workers, stale sessions/expired uploads are NOOP, notification concurrency=20 but no rate limit, compliance export stores full CSV in DB column, `stale_uploads`+`expired_uploads` both scheduled (overlap) |
| **P3**   | 4     | `/metrics` returns JSON not Prometheus format, circuit breaker half-open missing, no structured error codes, `PORT` vs `HEALTH_PORT` naming confusion in .env.example |

**Overall Verdict**: Worker is **operationally functional** with 4 critical bugs that need immediate attention. The search indexer Promise bug and webhook dead letter gap are the two highest-risk items.

---

## P0 — Critical

### W-001: Search indexer RPC fallback passes unresolved Promise to UPDATE

**File**: `apps/worker/src/processors/search-indexer.ts:40-47`
**Severity**: P0
**Status**: Open

**Finding**: When the `update_message_search_index` RPC is unavailable, the fallback code calls `supabase.rpc("to_tsvector", ...)` and passes the return value directly as the `search_vector` column value. `supabase.rpc()` returns a `PostgrestFilterBuilder` (which is thenable/Promise-like). `JSON.stringify` on a Promise produces `{}`, or the column assignment is simply invalid. The result: `search_vector` is set to garbage or NULL — search indexing is silently broken for all messages when the RPC is not available.

**Code** (`search-indexer.ts:40-47`):
```typescript
if (contentToIndex) {
  const { error: updateError } = await supabase
    .from("messages")
    .update({
      search_vector: supabase.rpc("to_tsvector", {
        english: contentToIndex,
      }) as unknown as undefined,
    })
    .eq("id", messageId);
```

**Required Fix**: `await` the RPC result before passing it into `.update()`:
```typescript
const { data: tsvector } = await supabase.rpc("to_tsvector", {
  english: contentToIndex,
});
const { error: updateError } = await supabase
  .from("messages")
  .update({ search_vector: tsvector })
  .eq("id", messageId);
```

---

### W-002: Worker webhook processor dead letter routing never fires (retryCount always 0)

**File**: `apps/worker/src/processors/webhook-delivery.ts:123`
**Severity**: P0
**Status**: Open

**Finding**: The BullMQ webhook worker checks `retryCount >= MAX_RETRIES` (line 123) to decide whether to write to `webhook_dead_letters`. However, `retryCount` comes from `job.data.retryCount` with a default of `0` (line 151). BullMQ does NOT auto-increment `job.data.retryCount` on retries — it tracks `job.attemptsMade` separately. Since no code sets `retryCount` in the job data, it is always `0`, so `retryCount >= MAX_RETRIES` (5) is NEVER true. Failed webhook jobs will exhaust their 6 BullMQ attempts (5 retries + 1 initial), then BullMQ moves them to the failed queue and they're removed by `removeOnFail`. The dead letter insert at line 124-131 is dead code — no webhook will ever be recorded as a dead letter via the worker processor path.

**Code** (`webhook-delivery.ts:123`):
```typescript
if (deliveryStatus === "failed" && retryCount >= MAX_RETRIES) {
  await supabase.from("webhook_dead_letters").insert({...});
}
```

**Required Fix**: Use `job.attemptsMade` from BullMQ, not `job.data.retryCount`:
```typescript
if (deliveryStatus === "failed" && job.attemptsMade >= MAX_RETRIES) {
  await supabase.from("webhook_dead_letters").insert({...});
}
```

**Note**: The API-side webhook service (`apps/api/src/modules/webhooks/service.ts`) has its OWN retry + dead letter logic with `setTimeout` that DOES work correctly (it increments `retryCount`). This means there are TWO separate, divergent webhook delivery implementations — the API inline delivery works, the worker BullMQ delivery is broken for dead letters.

---

### W-003: Dockerfile exposes wrong port (4001 vs 4100)

**File**: `apps/worker/Dockerfile:33`
**Severity**: P0
**Status**: Open

**Finding**: `EXPOSE 4001` in the Dockerfile, but the actual health/metrics HTTP server listens on `HEALTH_PORT` (default `4100`, configured at `main.ts:15`). The port `4001` appears nowhere else in the worker codebase. The HEALTHCHECK at Dockerfile:36 correctly uses port `4100`, so the container will be healthy, but the `EXPOSE` directive is misleading for tooling and documentation.

**Required Fix**: Change `EXPOSE 4001` to `EXPOSE 4100`, matching both the HEALTHCHECK and the actual code.

---

### W-004: `compliance-export` queue missing from centralized `QUEUE_NAMES` constant

**File**: `apps/worker/src/queues/index.ts:5-11`
**Severity**: P0 (documentation/inconsistency)
**Status**: Open

**Finding**: `QUEUE_NAMES` lists 5 queues but the worker actually has 6 (compliance-export is missing):
```
WEBHOOK_DELIVERY
NOTIFICATION
SEARCH_INDEXING
CLEANUP
DATA_RETENTION
```
Missing: `COMPLIANCE_EXPORT: "compliance-export"`

Additionally, `queues/index.ts` is NEVER imported by any file in the worker. The `main.ts` imports queue instances directly from each processor file. The entire `queues/index.ts` module is dead code — its `createWebhookQueue()`, `createNotificationQueue()`, etc. factory functions are unused.

**Required Fix**: Either delete `queues/index.ts` entirely (it's dead code) or wire it as the SSOT by exporting queue instances from here and importing them in processors. The former is simpler.

---

## P1 — High

### W-005: Circuit breaker never records success — only failures

**File**: `apps/worker/src/lib/circuit-breaker.ts:22-37`
**Severity**: P1
**Status**: Open

**Finding**: `executeWithCircuitBreaker()` records failures but NEVER clears them on success. A sliding window of 30s keeps failure timestamps. If a service has 4 failures in 29 seconds, then 100 successes, then 1 more failure 1 second later — the circuit opens despite 99% success rate. The circuit can only close passively via time expiry (old failures aging out of the 30s window). There is no half-open state, no success-counting, and no active reset.

**Required Fix**: On success, clear the failure list for that label (or decrement):
```typescript
const result = await fn();
// On success, clear recent failures for this label
failureTracker.delete(label);
return result;
```
Alternatively, implement proper half-open state (allow probe request after cooldown, close on success).

---

### W-006: Reminder polling uses `setInterval` — reminders lost on crash/restart

**File**: `apps/worker/src/main.ts:107-114`
**Severity**: P1
**Status**: Open

**Finding**: Reminders are polled via `setInterval(processReminders, 30_000)` which:
1. Has no durability — if the worker crashes between polls, any reminders due in that 30s window are lost until the next poll after restart
2. Runs inside the worker process — if the worker is down, NO reminders fire
3. Is not a BullMQ repeatable job — no retry, no DLQ, no monitoring in the metrics endpoint

**Required Fix**: Add reminders as a BullMQ repeatable job (like cleanup/retention), or at minimum add a `reminders` queue/processor. The `processReminders` function should be the processor handler, and the scheduler should enqueue a `reminders:poll` job every 30s as a repeatable.

---

### W-007: Data retention default `olderThanDays=90` mismatches scheduler values

**File**: `apps/worker/src/processors/data-retention.ts:248` vs `apps/worker/src/scheduler.ts:23-30`
**Severity**: P1
**Status**: Open

**Finding**: The scheduler enqueues retention jobs with specific `olderThanDays` per type. But the processor's fallback default at line 248 is `olderThanDays = 90`. If a job is manually enqueued without `olderThanDays`, it defaults to 90 days — which would delete notifications after 90 days instead of the scheduled 30, and messages after 90 days instead of 365.

**Scheduler values** (correct):
| Type                    | olderThanDays |
|-------------------------|---------------|
| messages                | 365           |
| audit_logs              | 90            |
| consent_logs            | 730           |
| soft_deleted_channels   | 30            |
| soft_deleted_workspaces | 30            |
| notifications           | 30            |

**Processor default**: 90 for ALL types.

**Required Fix**: Remove the generic default and require `olderThanDays` to be present, or set it per-type in the switch statement to match the schedule.

---

### W-008: In-app notification insert has no idempotency guard

**File**: `apps/worker/src/processors/notification.ts:31-38`
**Severity**: P1
**Status**: Open

**Finding**: `deliverInApp()` does a blind INSERT into `notifications` without checking for duplicates. The `withPerChannelRetry()` wrapper (line 258-261) retries up to 2 additional times if `deliverInApp` returns `false`. But `deliverInApp` returns `false` on DB error — the INSERT may have already succeeded on the first attempt even though it reported an error (network blip). Retrying creates duplicate notifications. There's no unique constraint on `(user_id, type, title, body, created_at)` so duplicates are possible.

**Required Fix**: Either:
1. Add a unique constraint on `notifications(user_id, type, title, created_at)` with a time-based window, or
2. Use the idempotency library (`lib/idempotency.ts`) by hashing `(userId, type, title, message)` before insert, or
3. Add `ON CONFLICT DO NOTHING` via a unique partial index

---

### W-009: `SUPABASE_ANON_KEY` required by env schema but never used by worker

**File**: `packages/config/env-schema.ts:14`
**Severity**: P1
**Status**: Open

**Finding**: The shared `baseEnvSchema` requires `SUPABASE_ANON_KEY: z.string().min(1)`. The worker only ever uses `SUPABASE_SERVICE_ROLE_KEY` (admin/privileged access). Requiring `SUPABASE_ANON_KEY` forces operators to provide a key the worker never reads. If the worker-specific env doesn't have this set, `loadEnv()` crashes with a Zod validation error.

**Required Fix**: Either:
1. Move `SUPABASE_ANON_KEY` to a separate API-only schema and make it optional in the base schema, or
2. Create a worker-specific `validateWorkerEnv()` that omits `SUPABASE_ANON_KEY`

---

### W-010: `withPerChannelRetry` retries permanent failures (missing email, missing VAPID keys)

**File**: `apps/worker/src/processors/notification.ts:102-127`
**Severity**: P1
**Status**: Open

**Finding**: `withPerChannelRetry` retries when the inner function returns `false`. But `deliverEmail` returns `false` when:
- No SMTP config (permanent — will never succeed)
- User has no email (permanent)

Similarly, `deliverPush` returns `false` when no VAPID keys are configured (permanent).

The retry loop wastes 3 attempts × (500ms + 1000ms) = 4.5 seconds on failures that can never succeed.

**Required Fix**: Distinguish permanent vs transient failures. Return a structured result `{ success: boolean, retryable: boolean }` from each delivery function, and only retry on `retryable: true`. Permanent failures should be logged and skipped immediately.

---

### W-011: Compliance export stores full CSV content in `csv_content` DB column

**File**: `apps/worker/src/processors/compliance-export.ts:216-217, 250-255`
**Severity**: P1
**Status**: Open

**Finding**: The entire CSV file content is stored in the `compliance_exports.csv_content` column (a `text` column). For large workspaces with thousands of messages, this could be megabytes of CSV data per export record. Over time with daily exports, this bloats the database and creates unnecessary storage cost. The CSV should be written to a file/storage bucket, with only a path/URL stored in the DB.

**Required Fix**: Upload CSV to Supabase Storage bucket (`chat-exports`) and store only the file path/URL in the `compliance_exports` table. Alternatively, generate the CSV on-demand from the DB when a download is requested.

---

## P2 — Medium

### W-012: Two divergent webhook delivery systems (API inline + Worker BullMQ)

**File**: `apps/worker/src/processors/webhook-delivery.ts` vs `apps/api/src/modules/webhooks/service.ts`
**Severity**: P2
**Status**: Open

**Finding**: The API has `WebhookService.deliver()` with its own retry (setTimeout-based), circuit breaker (`apps/api/src/lib/circuit-breaker.ts` — different instance from worker's), HMAC signing, and dead letter routing. The worker has `performWebhookDelivery()` with BullMQ retry (broken dead letter per W-002), no circuit breaker in the worker path (the worker CB is on the supabase client, not on the outbound webhook HTTP call), and its own delivery record insert.

These two systems share no code, have different retry strategies, different circuit breakers, and different error handling. A webhook delivered via the API path vs the worker path will behave differently.

**Required Fix**: Unify on one system. The worker BullMQ path is architecturally better (durable queue, exponential backoff, rate limiting). Move ALL webhook delivery to the worker, have the API only enqueue jobs via `webhookQueue.add()`, and delete the API's inline delivery logic. Fix W-002 first.

---

### W-013: Circuit breaker is in-memory only — no multi-worker coordination

**File**: `apps/worker/src/lib/circuit-breaker.ts:5`
**Severity**: P2
**Status**: Open

**Finding**: `failureTracker` is a `Map<string, number[]>` in process memory. If two worker instances run in parallel (e.g., for HA or scaling), each has an independent failure tracker. Instance A might have an open circuit while Instance B happily routes requests — inconsistent protection. This also means the circuit breaker state resets on every worker restart.

**Required Fix**: Move failure tracking to Redis (e.g., `circuit-breaker:{label}:failures` sorted set with TTL expiry) so all worker instances share the same circuit state.

---

### W-014: `queues/index.ts` is never imported — dead code

**File**: `apps/worker/src/queues/index.ts`
**Severity**: P2
**Status**: Open

**Finding**: No file in the worker imports from `./queues/index.js`. All queue creation happens inline in each processor file (e.g., `webhook-delivery.ts:22-30`, `cleanup.ts:19-25`, etc.). Searching the entire codebase for `import.*queues/index` or `from.*queues/index` yields zero results. The module creates Redis connections on import but since it's never imported, those connections are never created (no runtime impact). It's purely dead code.

**Required Fix**: Delete `apps/worker/src/queues/index.ts` or refactor processors to import queues from this central registry.

---

### W-015: Cleanup NOOP jobs (stale_sessions, expired_uploads) scheduled every 6h

**File**: `apps/worker/src/processors/cleanup.ts:247-252`, `apps/worker/src/scheduler.ts:36-37`
**Severity**: P2
**Status**: Open

**Finding**: The scheduler enqueues `stale_sessions` and `expired_uploads` cleanup jobs every 6 hours. The processor handlers for these types are NOOPs:
```typescript
case "stale_sessions":
  logger.info({ type }, "Stale session cleanup handled by Supabase auth hooks");
  break;
case "expired_uploads":
  logger.info({ type }, "Expired upload cleanup not implemented via DB (use stale_uploads)");
  break;
```
These jobs consume queue slots, worker CPU, and log noise without performing any cleanup.

**Required Fix**: Either implement the handlers or remove these from `CLEANUP_SCHEDULE` until implemented.

---

### W-016: `stale_uploads` and `expired_uploads` have overlapping intent

**File**: `apps/worker/src/scheduler.ts:36-37` and `apps/worker/src/processors/cleanup.ts:250`
**Severity**: P2
**Status**: Open

**Finding**: The scheduler has both `expired_uploads: 7 days` and `stale_uploads: 1 day`. The former is a NOOP, the latter actually cleans up storage objects. The naming is confusing — "expired" vs "stale" are synonyms in this context, but one is scheduled (7d) and does nothing, while the other is scheduled (1d) and works. The "expired_uploads" handler explicitly says "use stale_uploads". Having both in the schedule creates confusion.

**Required Fix**: Remove `expired_uploads` from `CLEANUP_SCHEDULE`. Rename `stale_uploads` to `stale_storage_objects` if clarity is needed.

---

### W-017: Notification processor concurrency=20 without rate limiting

**File**: `apps/worker/src/processors/notification.ts:281`
**Severity**: P2
**Status**: Open

**Finding**: The notification worker has `concurrency: 20`, meaning up to 20 notification jobs process simultaneously. Each job may trigger SMTP sends, VAPID push calls, and in-app DB inserts. 20 concurrent SMTP connections could overwhelm the SMTP relay. 20 concurrent VAPID push deliveries could hit rate limits on push services. The webhook worker has `limiter: { max: 100, duration: 60000 }` but the notification worker has no limiter.

**Required Fix**: Add a rate limiter to the notification worker, e.g., `limiter: { max: 50, duration: 60000 }` or reduce concurrency to 10.

---

### W-018: Compliance export `_scheduler` type doesn't use idempotency

**File**: `apps/worker/src/processors/compliance-export.ts:179-230` and `apps/worker/src/scheduler.ts:143-148`
**Severity**: P2
**Status**: Open

**Finding**: The scheduler registers a repeatable `scheduler:compliance` job AND calls `runComplianceExport()` at startup (which also enqueues compliance jobs for messages and audit_logs). The repeatable job has type `_scheduler` and creates its own export records (INSERT into compliance_exports). Meanwhile, `runComplianceExport()` at startup also creates export records and enqueues separate jobs with `type: "messages"` and `type: "audit_logs"`. On startup, there's potential double-export (the immediate run + the first repeatable firing close together).

**Required Fix**: Add idempotency key based on `(type, dateFrom, dateTo)` before inserting the compliance_export record. Or use a BullMQ jobId based on the date range to deduplicate.

---

### W-019: Worker shutdown doesn't drain BullMQ workers

**File**: `apps/worker/src/main.ts:122-133`
**Severity**: P2
**Status**: Open

**Finding**: The graceful shutdown handler closes the health server and quits Redis, but does NOT call `.close()` on any of the 6 BullMQ Worker instances. BullMQ workers should be gracefully closed to:
1. Stop accepting new jobs
2. Wait for in-flight jobs to complete (or timeout)
3. Release Redis connections cleanly

Without this, in-flight jobs are abandoned mid-execution.

**Required Fix**: Capture all worker instances from the register functions and close them in the shutdown handler:
```typescript
const workers = [
  registerWebhookProcessor(),
  registerNotificationProcessor(),
  // ...
];
const shutdown = async (signal: string) => {
  await Promise.all(workers.map(w => w.close()));
  // ...
};
```
The register functions DO return the worker instances (e.g., `cleanup.ts:300` returns `worker`), but `main.ts` discards the return values.

---

### W-020: Email delivery doesn't validate recipient before SMTP attempt

**File**: `apps/worker/src/processors/notification.ts:139-145`
**Severity**: P2
**Status**: Open

**Finding**: `deliverEmail()` queries `users.email` but doesn't validate the format. A malformed email stored in the DB would cause `transporter.sendMail()` to throw. The error is caught but retried via `withPerChannelRetry`, wasting retry attempts on a permanent failure.

**Required Fix**: Add email format validation after the DB query, and return `false` immediately without retry if the email is invalid.

---

### W-021: Reminder processor has no BullMQ queue — raw setInterval with no observability

**File**: `apps/worker/src/processors/reminder.ts`
**Severity**: P2
**Status**: Open

**Finding**: Reminders have no queue, no worker, no job counts in the `/metrics` endpoint. The `processReminders()` function runs directly via `setInterval` in `main.ts`. It's invisible to the metrics system and has no retry/DLQ. If the query fails, the error is only logged.

**Required Fix**: Create a `reminders` queue and processor. The scheduler should enqueue a `reminders:poll` repeatable job every 30s, and `processReminders()` should be the processor handler.

---

## P3 — Low

### W-022: `/metrics` endpoint returns JSON, not Prometheus exposition format

**File**: `apps/worker/src/main.ts:63-71`
**Severity**: P3
**Status**: Open

**Finding**: The `/metrics` endpoint returns `application/json` with job counts. Standard monitoring stacks (Prometheus, Grafana, Datadog) expect Prometheus exposition format (`text/plain` with `# HELP` / `# TYPE` comments and typed metrics). The current JSON endpoint requires a custom scraper.

**Required Fix**: Either add a `/metrics/prometheus` endpoint with Prometheus format, or document that `/metrics` is a custom JSON API (not Prometheus-compatible). For production monitoring, a Prometheus metrics endpoint is standard.

---

### W-023: Circuit breaker lacks half-open state

**File**: `apps/worker/src/lib/circuit-breaker.ts`
**Severity**: P3
**Status**: Open

**Finding**: The circuit breaker transitions directly from OPEN → CLOSED when the 30s window slides past the last failure. A proper circuit breaker has three states: CLOSED → OPEN (on threshold exceeded) → HALF_OPEN (after cooldown, allow 1 probe request) → CLOSED (probe succeeds) or OPEN (probe fails). The half-open state prevents thundering herd after circuit recovery.

**Required Fix**: Implement half-open state with a configurable cooldown before allowing probe requests.

---

### W-024: `.env.example` uses `PORT=4100` but code uses `HEALTH_PORT`

**File**: `apps/worker/.env.example:16` vs `apps/worker/src/main.ts:15`
**Severity**: P3
**Status**: Open

**Finding**: The env example documents `PORT=4100` but the actual code reads `process.env.HEALTH_PORT ?? "4100"`. The `PORT` variable is never read by the worker. Operators setting `PORT` in their `.env` would expect it to change the port, but it doesn't.

**Required Fix**: Change `.env.example` to document `HEALTH_PORT=4100` instead of `PORT=4100`.

---

### W-025: No structured error codes in processor failures

**File**: All processor files
**Severity**: P3
**Status**: Open

**Finding**: All processor error handling uses `logger.error({ error: String(err) }, ...)` with raw error strings. There are no structured error codes (e.g., `ERR_WEBHOOK_ENDPOINT_NOT_FOUND`, `ERR_CLEANUP_DB_TIMEOUT`). This makes alerting and dashboards difficult — you can't easily count "how many webhook deliveries failed due to URL validation vs HTTP 500".

**Required Fix**: Define error code constants in a shared module and use them in all catch blocks. The error codes from `packages/config/errors.ts` could be extended.

---

## Architecture Observations

### 1. Dual Redis Connections (working-as-designed but notable)

Two separate Redis connection pools exist:
- `apps/worker/src/lib/redis.ts` — used by health server and idempotency (1 connection, `maxRetriesPerRequest: 3`)
- Each BullMQ Worker/Queue creates its own `new Redis()` internally via BullMQ's `connection` option

BullMQ's default Redis connection uses `maxRetriesPerRequest: null` (required by BullMQ). The health check Redis and idempotency Redis are separate instances. This means:
- Health check Redis being down doesn't affect BullMQ queues
- But it also means the health check doesn't reflect the BullMQ Redis connection state

This is acceptable but worth documenting.

### 2. Queue Configuration Discrepancy Between Factories and Actual Queues

`queues/index.ts` factory functions specify different `defaultJobOptions` than what the actual processor files create:
- Factory `createWebhookQueue`: `removeOnComplete: 100, removeOnFail: 50, attempts: 5`
- Actual `webhook-delivery.ts`: `attempts: MAX_RETRIES + 1` (6), `removeOnComplete: { age: 86400 }, removeOnFail: { age: 86400 }`

Since the factories are never used, this is only a documentation concern. But it highlights that `queues/index.ts` is diverged from reality.

### 3. Supabase Client Singleton Works Correctly

`createSupabaseClient()` in `supabase.ts` creates a singleton wrapped in a circuit breaker Proxy. All processors and the reminder module share this same client. The Proxy intercepts ALL method calls on the supabase client (`.from()`, `.rpc()`, `.storage`, `.schema()`, etc.) and routes them through `executeWithCircuitBreaker("supabase:query", ...)`. This means the granularity is coarse — all Supabase calls share a single circuit breaker label. If `messages.delete()` fails 5 times, it trips the breaker for ALL Supabase operations (including `notifications.insert()`, `users.select()`, etc.). A per-table or per-operation label would be more resilient.

---

## File-by-File Summary

| File | Lines | Key Issues |
|------|-------|------------|
| `main.ts` | 140 | W-006 (setInterval reminders), W-019 (no BullMQ drain), W-022 (JSON metrics) |
| `scheduler.ts` | 171 | W-015 (NOOP jobs), W-018 (double-export) |
| `queues/index.ts` | 92 | W-004 (missing queue), W-014 (dead code) |
| `lib/redis.ts` | 38 | (OK — singleton pattern, lazy connect) |
| `lib/supabase.ts` | 44 | (OK — CB proxy works, coarse granularity noted) |
| `lib/circuit-breaker.ts` | 41 | W-005 (only records failures), W-013 (in-memory), W-023 (no half-open) |
| `lib/idempotency.ts` | 37 | (OK — SHA256 hash + Redis SET NX, 24h TTL, fail-open) |
| `templates/email.ts` | 128 | (OK — clean HTML, no XSS vectors in template vars) |
| `processors/cleanup.ts` | 301 | W-015 (NOOP jobs), W-016 (overlap) |
| `processors/compliance-export.ts` | 305 | W-011 (CSV in DB), W-018 (double-export) |
| `processors/data-retention.ts` | 317 | W-007 (default mismatch) |
| `processors/notification.ts` | 298 | W-008 (no idempotency), W-010 (retries permanent), W-017 (high concurrency), W-020 (no email validation) |
| `processors/reminder.ts` | 56 | W-006 (setInterval), W-021 (no queue) |
| `processors/search-indexer.ts` | 137 | W-001 (Promise bug) |
| `processors/webhook-delivery.ts` | 179 | W-002 (dead letter never fires), W-012 (dual system) |
| `Dockerfile` | 38 | W-003 (wrong EXPOSE) |
| `package.json` | 35 | W-009 (`SUPABASE_ANON_KEY` required transitively) |
| `.env.example` | 30 | W-024 (`PORT` vs `HEALTH_PORT`) |

---

## Recommended Fix Priority

### Immediate (before next deploy)
1. **W-001** — Fix search indexer Promise bug (silent data corruption)
2. **W-002** — Fix webhook dead letter routing (use `job.attemptsMade`)
3. **W-003** — Fix Dockerfile EXPOSE port
4. **W-005** — Add success clearing to circuit breaker

### This Week
5. **W-006 / W-021** — Move reminders to BullMQ repeatable job
6. **W-007** — Fix data retention defaults per-type
7. **W-008** — Add idempotency to in-app notification insert
8. **W-009** — Make `SUPABASE_ANON_KEY` optional for worker
9. **W-010** — Distinguish permanent vs transient failures in `withPerChannelRetry`
10. **W-019** — Drain BullMQ workers on shutdown

### Next Sprint
11. **W-004 / W-014** — Delete dead `queues/index.ts`
12. **W-011** — Move CSV exports to storage bucket
13. **W-012** — Unify webhook delivery into worker-only
14. **W-013** — Redis-backed circuit breaker
15. **W-015 / W-016** — Implement or remove NOOP cleanup jobs
16. **W-017** — Add rate limiter to notification worker

### Backlog
17. **W-018** — Compliance export idempotency
18. **W-020** — Email validation before SMTP
19. **W-022** — Prometheus metrics format
20. **W-023** — Half-open circuit breaker state
21. **W-024** — Fix .env.example variable name
22. **W-025** — Structured error codes

---

## What's Working Well

1. **Queue retry defaults are reasonable**: webhook 5 retries with 60s exponential backoff, notification 3 retries with 30s backoff, search 3 retries with 10s backoff.
2. **Circuit breaker proxy on Supabase client** is elegantly implemented — all DB calls automatically protected.
3. **Idempotency library** is well-designed with SHA256 hashing, Redis SET NX, 24h TTL, and fail-open on Redis error.
4. **HMAC webhook signing** + SSRF protection (URL validation, private IP blocking, DNS resolution check) is thorough.
5. **Health check endpoint** covers Redis status and returns appropriate HTTP codes (200/503).
6. **Dockerfile** uses non-root user (`appuser:1001`), HEALTHCHECK with wget, multi-stage build.
7. **Scheduler** uses BullMQ repeatable jobs with custom `jobId` for deduplication.
8. **All processors** use `Promise.race` with `AbortSignal.timeout` for per-job timeouts.
9. **Graceful shutdown** handles SIGTERM/SIGINT with a 10s force-exit timeout.
10. **Email templates** are clean HTML with inline styles (email-client compatible).

---

*Audit performed: July 24, 2026. All 15 source files read completely. 25 findings across P0-P3.*
