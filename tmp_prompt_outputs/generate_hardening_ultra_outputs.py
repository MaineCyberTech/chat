"""
Generate all 8 hardening ultra prompt output JSON files and ingest them.
"""
import json, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(r"C:\temp\chat")
OUTPUTS = REPO / "tmp_prompt_outputs"
INGEST = REPO / "scripts" / "prompts" / "ingest_output.py"
now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

prompts = []

# ============================================================
# 1. Security Ultra
# ============================================================
prompts.append({
    "prompt_name": "security_ultra",
    "domain": "security",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 4, "P1": 4, "P2": 3, "P3": 2},
    "category_scores": {"api_routes_security": 35, "auth_flows": 40, "rbac_tenancy": 30, "headers_middleware": 50, "rate_limiting": 35},
    "readiness": 38.0,
    "findings": [
        {"severity": "P0", "domain": "security", "category": "IDOR",
         "file": "apps/api/src/modules/reactions/routes.ts",
         "issue": "Reaction routes have no workspace/channel membership check — any authed user can access any message's reactions",
         "impact": "Direct cross-tenant data access: User A can add/remove reactions on any message in any workspace",
         "fix": "Add requireChannelAccess middleware to all reaction routes",
         "endpoint": "GET/POST/DELETE /v1/messages/:id/reactions, GET /v1/reactions/batch",
         "exploit_chain": "1. Attacker registers on platform and gets JWT. 2. Attacker guesses or enumerates message IDs. 3. Attacker calls GET /v1/messages/:id/reactions on messages in workspaces they don't belong to. 4. Attacker reads, adds, or removes reactions cross-tenant."},
        {"severity": "P0", "domain": "security", "category": "Auth bypass",
         "file": "apps/api/src/modules/feature-flags/routes.ts",
         "issue": "Feature-flag routes have broken requireWorkspaceMembership('workspaceId') on paths without :workspaceId param — always returns 400",
         "impact": "Feature flags are completely non-functional; no workspace can manage or evaluate feature flags",
         "fix": "Remove requireWorkspaceMembership from feature-flag routes or add workspaceId as a body/query parameter",
         "endpoint": "ALL /v1/feature-flags/*",
         "exploit_chain": "1. Any workspace admin tries to enable a feature flag. 2. Every request fails with 400 'Missing workspaceId'. 3. Feature flags exist in DB but cannot be managed through API — Denial of Service for workspace configuration."},
        {"severity": "P0", "domain": "security", "category": "Missing validation",
         "file": "apps/api/src/modules/messages/routes.ts",
         "issue": "Message search uses getSupabase() (anon client) instead of req.supabase — auth.uid() is NULL in SECURITY INVOKER search RPC",
         "impact": "search_messages function cannot verify user workspace membership — cross-tenant message content leak",
         "fix": "Replace getSupabase() with req.supabase on messages/routes.ts line 38",
         "endpoint": "GET /v1/messages/search",
         "exploit_chain": "1. Attacker obtains valid JWT. 2. Attacker calls GET /v1/messages/search?q=confidential&workspace_id=TARGET_ID. 3. Search function uses anon (no-JWT) Supabase client. 4. auth.uid() is NULL in SECURITY INVOKER function — membership check fails open. 5. Search returns messages from any workspace."},
        {"severity": "P0", "domain": "security", "category": "Injection vectors",
         "file": "supabase/migrations/20260625000020_auto_create_user_profile.sql",
         "issue": "4 SECURITY DEFINER functions missing SET search_path — search_path injection vulnerability",
         "impact": "User with CREATE privilege can create malicious objects to hijack functions running with elevated privileges",
         "fix": "Add SET search_path = 'public' to all SECURITY DEFINER function definitions",
         "endpoint": "Trigger functions: handle_new_user, handle_new_channel, handle_new_workspace",
         "exploit_chain": "1. Attacker creates a schema or function named 'public.delete_all_profiles'. 2. Attacker sets search_path to include their schema. 3. When SECURITY DEFINER function runs, it executes attacker's version instead of the intended function. 4. Privilege escalation to database owner level."},
        {"severity": "P1", "domain": "security", "category": "Rate limiting",
         "file": "apps/api/src/middleware/rate-limit.ts",
         "issue": "Auth and search rate limiters key by IP only — not user+IP composite. No per-email rate limiting on auth endpoints.",
         "impact": "Multiple users behind same NAT share rate limit bucket; single attacker with rotating IPs bypasses limits; no brute-force protection on email-based auth",
         "fix": "Use composite key {userId + ip} when authenticated; add per-email rate limiting for magic link sign-in",
         "endpoint": "GET /v1/auth/search, POST magic link sign-in"},
        {"severity": "P1", "domain": "security", "category": "Privilege escalation",
         "file": "apps/api/src/modules/workspaces/routes.ts",
         "issue": "Workspace member management (add/remove/update role) lacks admin/owner role check — any workspace member can modify members",
         "impact": "Any workspace member can escalate their own role to admin, add/remove other members, or change roles",
         "fix": "Add admin/owner role verification in POST/PATCH/DELETE workspace member routes",
         "endpoint": "POST /v1/workspaces/:id/members, PATCH /v1/workspaces/:id/members/:userId, DELETE /v1/workspaces/:id/members/:userId"},
        {"severity": "P1", "domain": "security", "category": "Secrets handling",
         "file": "apps/api/src/modules/webhooks/service.ts",
         "issue": "Webhook secret stored in plaintext and returned in API responses to all workspace members",
         "impact": "Any workspace member can read other webhook secrets — if webhook is used for CI/CD, full pipeline access",
         "fix": "Encrypt webhook secret at rest using pgcrypto; mask secret in API responses with last 4 chars only",
         "endpoint": "GET /v1/webhooks, GET /v1/webhooks/:id"},
        {"severity": "P1", "domain": "security", "category": "Auth flows",
         "file": "apps/api/src/lib/socket.ts",
         "issue": "Socket.io has allowEIO3: true enabling Engine.IO v3 legacy protocol with known vulnerabilities",
         "impact": "Expanded attack surface — Engine.IO v3 has known vulnerabilities and fewer security features than v4",
         "fix": "Set allowEIO3: false unless backward compatibility is proven necessary",
         "endpoint": "Socket.io connection"},
        {"severity": "P2", "domain": "security", "category": "Defense-in-depth",
         "file": "apps/api/src/lib/socket.ts",
         "issue": "No per-event Socket.io rate limiting — channel:join, typing:start/stop events not rate-limited",
         "impact": "Malicious client can flood socket events, degrading service for all users",
         "fix": "Add per-socket event rate limiting with configurable window and max count",
         "endpoint": "Socket.io events"},
        {"severity": "P2", "domain": "security", "category": "Defense-in-depth",
         "file": "apps/api/src/middleware/csrf.ts",
         "issue": "CSRF cookie has httpOnly: false — any XSS can exfiltrate the double-submit token",
         "impact": "If XSS exists, CSRF protection is completely bypassed as the token is readable by JavaScript",
         "fix": "Add additional CSRF layer (origin/referer checking) on top of double-submit cookie pattern"},
        {"severity": "P2", "domain": "security", "category": "Headers/Middleware",
         "file": "apps/api/src/middleware/security-headers.ts",
         "issue": "CSP allows cdn.jsdelivr.net for scripts — broad CDN allowlist enables script injection from any package on that CDN",
         "impact": "If an attacker finds an XSS vector, they can load malicious scripts from jsdelivr",
         "fix": "Remove CDN wildcard; use specific integrity-hashed URLs for required external scripts"},
        {"severity": "P3", "domain": "security", "category": "Best practice",
         "file": "apps/api/src/middleware/security-headers.ts",
         "issue": "CSP lacks nonce-based protection for inline scripts",
         "impact": "Any injected <script> tag executes in browsers that don't support strict-dynamic or if CSP is not properly enforced",
         "fix": "Implement nonce-based CSP for all inline script tags"},
        {"severity": "P3", "domain": "security", "category": "Best practice",
         "file": "apps/api/Dockerfile",
         "issue": "wget installed in production Docker image — unnecessary package expands attack surface",
         "impact": "Extra package in runtime image can be used as attack vector if other vulnerabilities exist",
         "fix": "Remove wget; use built-in health check mechanism or curl if needed"}
    ]
})

# ============================================================
# 2. Data Ultra
# ============================================================
prompts.append({
    "prompt_name": "data_ultra",
    "domain": "data",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 2, "P1": 3, "P2": 3, "P3": 1},
    "category_scores": {"schema_integrity": 45, "concurrency_safety": 30, "transaction_coverage": 35, "index_optimization": 40},
    "readiness": 37.0,
    "findings": [
        {"severity": "P0", "domain": "data", "category": "Race conditions",
         "file": "apps/api/src/modules/workspaces/service.ts",
         "issue": "Workspace slug dedup loop in workspaces service has no max-attempt guard — while(true) can hang forever",
         "impact": "If all slug variants are taken (e.g., 'workspace-1' through 'workspace-100'), the loop spins indefinitely — potential DoS",
         "fix": "Add MAX_ATTEMPTS=100 counter and throw error after exhausting attempts — already done in workspaces/service.ts but CHECK channels/service.ts has NO safeguard",
         "data_path": "public.workspaces.slug"},
        {"severity": "P0", "domain": "data", "category": "Concurrency safety",
         "file": "supabase/migrations/",
         "issue": "No optimistic locking on any PATCH handler — no If-Match header, no version column, no checkVersionMatch pattern",
         "impact": "Concurrent edits silently overwrite each other — last writer wins with no conflict detection",
         "fix": "Add version column (INT DEFAULT 1) to messages, workspaces, channels tables; implement If-Match header check in PATCH handlers; return 409 on version mismatch",
         "data_path": "public.messages, public.workspaces, public.channels"},
        {"severity": "P1", "domain": "data", "category": "Relational integrity",
         "file": "supabase/migrations/20260625000012_create_webhooks.sql",
         "issue": "webhook_endpoints.created_by FK has no ON DELETE action — defaults to RESTRICT",
         "impact": "Deleting an auth user who created webhooks will fail with FK violation; user deletion cascading is blocked",
         "fix": "Add ON DELETE SET NULL or ON DELETE CASCADE to the FK constraint",
         "data_path": "public.webhook_endpoints.created_by"},
        {"severity": "P1", "domain": "data", "category": "Schema drift",
         "file": "packages/db/src/types.ts",
         "issue": "TypeScript types severely out of sync with DB schema — 6 interfaces defined vs 16 tables; soft-delete fields missing from Workspace/Channel/Message types",
         "impact": "Type-safety gaps across codebase; developers must use 'any' for non-existent types; schema drift goes undetected",
         "fix": "Run supabase gen types typescript --local > packages/db/src/types.ts; add CI check for type-schema drift"},
        {"severity": "P1", "domain": "data", "category": "Orphan records",
         "file": "supabase/migrations/20260625000014_soft_delete.sql",
         "issue": "Soft-delete on workspaces/channels/messages does not cascade soft-delete to child records (channel_members, messages in workspace, reactions on soft-deleted messages)",
         "impact": "Orphaned channel_members point to deleted channels; reactions on soft-deleted messages remain; workspace soft-delete leaves all channels/messages undeleted",
         "fix": "Add trigger to cascade soft-delete: workspace soft-delete -> soft-delete all channels -> soft-delete all messages; channel soft-delete -> soft-delete all messages",
         "data_path": "public.workspaces.deleted_at -> public.channels.deleted_at -> public.messages.deleted_at"},
        {"severity": "P2", "domain": "data", "category": "Missing indices",
         "file": "supabase/migrations/20260625000008_create_reactions.sql",
         "issue": "Missing index on reactions.message_id — all reaction queries filter by message_id but no index exists",
         "impact": "Full table scans on every reaction fetch; O(n) per message on reaction-heavy channels",
         "fix": "CREATE INDEX idx_reactions_message_id ON public.reactions(message_id)"},
        {"severity": "P2", "domain": "data", "category": "Transaction coverage",
         "file": "apps/api/src/modules/workspaces/service.ts",
         "issue": "Workspace creation is multi-table (workspaces + workspace_members + webhook trigger) but NOT wrapped in a DB transaction",
         "impact": "If workspace_members insert succeeds but subsequent operations fail, partial state exists — orphan workspace or missing member records",
         "fix": "Wrap workspace creation in Supabase RPC with BEGIN/COMMIT/ROLLBACK, or use application-level compensating actions"},
        {"severity": "P2", "domain": "data", "category": "Missing indices",
         "file": "supabase/migrations/",
         "issue": "Missing composite index on channel_members (channel_id, user_id) — private channel access checks use this pair",
         "impact": "Slow channel access checks on private channels with many members",
         "fix": "CREATE INDEX idx_channel_members_channel_user ON public.channel_members(channel_id, user_id)"},
        {"severity": "P3", "domain": "data", "category": "Best practice",
         "file": "supabase/migrations/",
         "issue": "No down/rollback scripts for any of 26 migrations — forward-fix is only recovery path",
         "impact": "Schema rollback requires PITR with data loss; no automated way to reverse a migration",
         "fix": "Write .down.sql scripts for all 26 migrations; mandate down scripts in migration template"}
    ]
})

# ============================================================
# 3. Resilience/Chaos Ultra
# ============================================================
prompts.append({
    "prompt_name": "resilience_chaos_ultra",
    "domain": "resilience",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 3, "P1": 3, "P2": 3, "P3": 1},
    "category_scores": {"timeout_handling": 30, "retry_backoff": 35, "circuit_breaker": 35, "idempotency": 40, "ui_degraded_states": 30},
    "readiness": 34.0,
    "findings": [
        {"severity": "P0", "domain": "resilience", "category": "API outage",
         "file": "apps/api/src/modules/messages/service.ts",
         "issue": "No request timeout on Supabase queries — a slow DB query can block the Node event loop indefinitely",
         "impact": "Complete API degradation if Supabase becomes slow: all request threads block, no request can complete",
         "fix": "Add AbortSignal.timeout(10000) to all Supabase queries; return 503 on timeout with structured error",
         "scenario": "Supabase experiences 30s query latency due to heavy load. Every API endpoint calling Supabase blocks its request thread. Node.js event loop fills with pending callbacks. All subsequent requests queue with increasing latency. API becomes completely unresponsive after 10-20 concurrent slow queries. No timeout to release resources."},
        {"severity": "P0", "domain": "resilience", "category": "Websocket disconnect",
         "file": "apps/api/src/lib/socket.ts",
         "issue": "No Socket.io connection state recovery — clients lose all room state on disconnect; no reconnection backoff strategy configured",
         "impact": "On network blip, all clients must manually re-join rooms and re-fetch state; messages sent during disconnect window are lost",
         "fix": "Enable connectionStateRecovery in Socket.io; implement client-side exponential backoff reconnection; add message queue flush on reconnect",
         "scenario": "Network partition occurs for 5 seconds. All 100 connected WebSocket clients disconnect. On reconnect, each client must re-emit channel:join for every channel they were in (potentially 10+ events each). Server receives 1000+ join events simultaneously. During the disconnect window, any messages sent are not received by disconnected clients — no offline queue exists."},
        {"severity": "P0", "domain": "resilience", "category": "Circuit breaker",
         "file": "apps/api/src/lib/circuit-breaker.ts",
         "issue": "Circuit breaker implemented via opossum but only wired to webhook delivery — NOT to Supabase client, not to Redis, not to external HTTP calls",
         "impact": "Cascading failure from slow Supabase: every request tries Supabase, all fail slowly, no circuit opens to give recovery time",
         "fix": "Wrap Supabase client queries in circuit breaker; add circuit breaker around Redis operations; expose breaker state in /metrics and /health",
         "scenario": "Supabase primary has a failover event taking 60 seconds. Every API request (50+ per second) sends a query to Supabase and waits. Circuit breaker on Supabase would detect >50% failure rate and open after 10 requests, returning fast 503 for subsequent requests. Without circuit breaker, all 3000 requests in that minute each wait for the 30s query timeout, completely exhausting node event loop."},
        {"severity": "P1", "domain": "resilience", "category": "Retry logic",
         "file": "apps/api/src/services/audit.ts",
         "issue": "Audit event queue is in-memory with no persistence — lost on process restart; retry delay is fixed 5s with no exponential backoff",
         "impact": "Audit events during restart window are permanently lost; no backoff causes congestion on recovery",
         "fix": "Replace in-memory queue with Redis-backed queue; implement exponential backoff (1s, 2s, 4s, 8s, 16s) for retries",
         "scenario": "API process restarts during deploy. 50 pending audit events in the in-memory queue are lost. These events include workspace creation, member additions, and message deletions — audit trail has a gap. After restart, retry fires all failed writes at 5s intervals, potentially overloading Supabase."},
        {"severity": "P1", "domain": "resilience", "category": "Partial writes",
         "file": "apps/api/src/modules/workspaces/service.ts",
         "issue": "Bulk workspace member operations (add/remove) return success/failure per item but don't wrap in transaction — partial success possible",
         "impact": "Half of a bulk member operation may succeed while other half fails, leaving workspace in inconsistent state",
         "fix": "Wrap bulk member operations in Supabase RPC with transaction; return per-item results with ok/error pattern",
         "scenario": "Admin adds 10 members to a workspace in a single call. Member 5's user_id doesn't exist. Database rejects the INSERT. But members 1-4 were already inserted. The API returns 200 with no indication of partial failure. Workspace now has 4 members but admin thinks all 10 were added."},
        {"severity": "P1", "domain": "resilience", "category": "Double execution",
         "file": "apps/api/src/modules/webhooks/service.ts",
         "issue": "Webhook delivery retry generates new idempotency key per attempt — receiver cannot deduplicate across retries",
         "impact": "Webhook receivers may process the same event multiple times (duplicate CI builds, duplicate notifications)",
         "fix": "Use stable event-based idempotency key (e.g., hash of event type + trigger timestamp + webhook_id) across all retry attempts",
         "scenario": "Webhook delivery times out after 10s. Retry fires with a NEW idempotency key. Both requests eventually reach the receiver. The receiver processes the same 'deploy:complete' event twice, triggering two separate CI pipeline runs and two Slack notifications."},
        {"severity": "P2", "domain": "resilience", "category": "Incorrect UI states",
         "file": "apps/web/components/chat/chat-view.tsx",
         "issue": "Message send has no optimistic UI rollback on error — if message send fails, there is no user-visible error or retry mechanism",
         "impact": "Failed sends silently disappear from UI; users must retype messages",
         "fix": "Show inline error state on failed messages with 'Retry' button; preserve message content for retry",
         "scenario": "User types a 500-character message and clicks Send. The API call fails due to network timeout. The message was optimistically added to the UI but disappears when the API call completes with an error. User sees no indication of failure and assumes the message was sent."},
        {"severity": "P2", "domain": "resilience", "category": "Async breakdown",
         "file": "apps/api/src/lib/idempotency.ts",
         "issue": "In-memory idempotency fallback has no size limit or eviction policy — unbounded memory growth",
         "impact": "Memory leak under high message volume; process OOM can kill the API server",
         "fix": "Add LRU eviction with max 10000 entries to in-memory Map fallback",
         "scenario": "A marketing campaign triggers a burst of 100,000 messages in 10 minutes. Each message carries an idempotency key. The in-memory Map grows to 100,000 entries (one per message). Each entry stores a message ID string + timestamp. At ~100 bytes per entry, this is 10MB — not huge, but without limits, sustained 1M+ requests/day leads to unbounded growth."},
        {"severity": "P2", "domain": "resilience", "category": "Retry logic",
         "file": "apps/api/src/services/audit.ts",
         "issue": "Audit service retry uses setTimeout with no max retry count cap — can retry indefinitely",
         "impact": "Theoretically infinite retries on persistent failures, wasting resources and creating log noise",
         "fix": "Add maxRetries (3) and dead-letter after exhaustion, similar to webhook service pattern",
         "scenario": "Supabase connection is permanently failing (wrong credentials). The audit service queues every audit event and retries every 5 seconds, forever. Each retry attempt logs a warning. After 24 hours, there are 17,280 failed retry attempts consuming CPU and log storage."}
    ]
})

# ============================================================
# 4. Observability Ultra
# ============================================================
prompts.append({
    "prompt_name": "observability_ultra",
    "domain": "observability",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 1, "P1": 3, "P2": 3, "P3": 2},
    "category_scores": {"structured_logging": 55, "tracing": 35, "metrics": 50, "health_checks": 65, "error_tracking": 60, "audit_logging": 50},
    "readiness": 52.0,
    "findings": [
        {"severity": "P0", "domain": "observability", "category": "Blind spots",
         "file": "",
         "issue": "No distributed tracing — only basic request IDs, no span propagation across API -> DB -> WebSocket -> webhook -> background jobs",
         "impact": "Cannot trace a single user action across service boundaries; debugging complex failures requires manually correlating log timestamps across services with no shared trace ID",
         "fix": "Add OpenTelemetry instrumentation for Express, Supabase queries, Socket.io events, and outbound HTTP calls; propagate trace context via headers"},
        {"severity": "P1", "domain": "observability", "category": "Structured logging",
         "file": "apps/api/src/lib/logger.ts",
         "issue": "No automatic request logging middleware — every request log line must be manually emitted, leading to inconsistent log coverage",
         "impact": "Some requests produce no access log at all; cannot audit all API calls; correlation requires manual context passing",
         "fix": "Add auto-request-logging middleware that captures method, path, status code, duration, and request ID for every request before route handler"},
        {"severity": "P1", "domain": "observability", "category": "Tracing",
         "file": "apps/api/src/middleware/request-id.ts",
         "issue": "Request ID is not propagated to Socket.io events, background jobs, or outbound webhook calls",
         "impact": "Cannot correlate WebSocket events or webhook deliveries with originating API request — making debugging of async flows impossible",
         "fix": "Attach request ID to Socket.io event payloads; pass to worker tasks; include in outbound webhook X-Request-ID header"},
        {"severity": "P1", "domain": "observability", "category": "Metrics",
         "file": "apps/api/src/lib/metrics.ts",
         "issue": "18 Prometheus metrics defined but no remote collector configured — metrics sit in memory and are only accessible via unauthenticated /metrics endpoint",
         "impact": "Metrics are generated but never aggregated, alerted on, or visualized; the entire metrics infrastructure has no consumer",
         "fix": "Configure Prometheus remote write or set up a Grafana Cloud integration to push metrics; configure retention and alert rules"},
        {"severity": "P2", "domain": "observability", "category": "Silent catch blocks",
         "file": "apps/api/src/modules/notifications/service.ts",
         "issue": "Push notification delivery failures logged via console.error instead of structured logger.error — no structured context, no trace ID, no error taxonomy",
         "impact": "Push notification failures are invisible in centralized logging; cannot alert on failure rate or diagnose types of failures",
         "fix": "Replace console.error with logger.error including structured context: notification type, user agent, endpoint, error code, request ID"},
        {"severity": "P2", "domain": "observability", "category": "Health checks",
         "file": "apps/api/src/modules/health/routes.ts",
         "issue": "Health checks validate only database connectivity — no Redis, Supabase Storage, or external dependency checks",
         "impact": "Health check can pass 'healthy' while critical dependencies are down, giving false confidence to orchestrator",
         "fix": "Add optional dependency checks for Redis (if REDIS_URL configured), Supabase Storage endpoint, and circuit breaker states"},
        {"severity": "P2", "domain": "observability", "category": "Audit logging",
         "file": "apps/api/src/services/audit.ts",
         "issue": "Audit event queue is in-memory — events lost on process restart; no Redis-backed persistence",
         "impact": "Audit trail gaps during deploy windows; compliance risk for sensitive operations",
         "fix": "Replace in-memory queue with Redis-backed Bull queue with persistent storage"},
        {"severity": "P3", "domain": "observability", "category": "Logging coverage",
         "file": "",
         "issue": "Frontend has no structured logging — only console.log/error used ad-hoc with no consistent format",
         "impact": "Client-side errors cannot be diagnosed from logs; no frontend telemetry for UX monitoring",
         "fix": "Add frontend logging library (loglevel or pino-web) with remote log shipping; integrate with Sentry breadcrumbs"},
        {"severity": "P3", "domain": "observability", "category": "Metrics",
         "file": "",
         "issue": "No worker health endpoint nor Prometheus metrics — apps/worker has zero observability instrumentation",
         "impact": "Worker failures (stuck jobs, OOM, queue backlogs) are invisible until users report symptoms",
         "fix": "Add health endpoint and basic metrics (jobs processed, queue depth, error rate) to apps/worker"}
    ]
})

# ============================================================
# 5. Supply Chain Ultra
# ============================================================
prompts.append({
    "prompt_name": "supply_chain_ultra",
    "domain": "supply_chain",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 2, "P1": 2, "P2": 2, "P3": 1},
    "category_scores": {"dependency_hygiene": 45, "docker_security": 50, "ci_cd_artifacts": 40, "lockfile_integrity": 60},
    "readiness": 48.0,
    "findings": [
        {"severity": "P0", "domain": "supply_chain", "category": "CI/CD artifacts",
         "file": ".github/workflows/validate.yml",
         "issue": "Trivy vulnerability scanner uses @master mutable tag — not pinned to a specific SHA or semver",
         "impact": "Supply chain risk: a compromised or updated @master could introduce malicious code into CI pipeline without review",
         "fix": "Pin trivy-action to a specific SHA (e.g., aquasecurity/trivy-action@595be6a...) or semver tag (e.g., @v0.28.0)"},
        {"severity": "P0", "domain": "supply_chain", "category": "CI/CD artifacts",
         "file": ".github/workflows/build-push.yml",
         "issue": "Trivy action also uses @master tag in build-push.yml — same supply chain issue",
         "impact": "Supply chain risk across two CI workflows using unpinned mutable reference",
         "fix": "Pin trivy-action to a specific SHA in build-push.yml as well"},
        {"severity": "P1", "domain": "supply_chain", "category": "Dependencies",
         "file": "",
         "issue": "pnpm audit threshold set to --audit-level=moderate — only blocks moderate+ severity; high/critical advisories pass if below moderate threshold",
         "impact": "High-severity dependency vulnerabilities may not block CI; false sense of security from audit check",
         "fix": "Set --audit-level=high to at minimum block high-severity vulnerabilities; consider blocking at critical level"},
        {"severity": "P1", "domain": "supply_chain", "category": "Docker hygiene",
         "file": "apps/api/Dockerfile",
         "issue": "wget installed in production Docker image — unnecessary package increases runtime attack surface",
         "impact": "Extra package in production container provides additional attack vector for RCE exploits",
         "fix": "Remove wget from production Dockerfile; use curl or HEALTHCHECK built-in instead"},
        {"severity": "P2", "domain": "supply_chain", "category": "Docker hygiene",
         "file": "apps/api/Dockerfile",
         "issue": "Docker multi-stage builds use npm ci and then discard devDependencies, but pnpm store is not cleaned — final image may contain package manager artifacts",
         "impact": "Unnecessary layer bloat increases image size and attack surface",
         "fix": "Add pnpm store prune and .pnpm-store directory cleanup in final stage"},
        {"severity": "P2", "domain": "supply_chain", "category": "Dependencies",
         "file": "",
         "issue": "No Dependabot or Renovate configuration for automated dependency updates — .github/dependabot.yml does not exist",
         "impact": "Dependency vulnerabilities may go unnoticed until manually discovered; no automated PRs for security patches",
         "fix": "Create .github/dependabot.yml with weekly checks for npm, GitHub Actions, and Docker dependencies"},
        {"severity": "P3", "domain": "supply_chain", "category": "Docker hygiene",
         "file": "apps/api/Dockerfile",
         "issue": "Dockerfile has HEALTHCHECK (good) but no USER directive — containers run as root by default",
         "impact": "If container is compromised, attacker has root access inside the container",
         "fix": "Add 'USER appuser' after installing dependencies; create appuser in Dockerfile"}
    ]
})

# ============================================================
# 6. Privacy Ultra
# ============================================================
prompts.append({
    "prompt_name": "privacy_ultra",
    "domain": "privacy",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 1, "P1": 3, "P2": 2, "P3": 1},
    "category_scores": {"pii_handling": 45, "retention_policy": 25, "access_controls": 45, "compliance_basics": 35},
    "readiness": 37.0,
    "findings": [
        {"severity": "P0", "domain": "privacy", "category": "PII exposure",
         "file": "apps/api/src/modules/workspaces/service.ts",
         "issue": "Workspace member list returns email field in API response — all workspace members can see each other's email addresses",
         "impact": "PII (email addresses) exposed to all workspace members unnecessarily; email enumeration across workspace membership",
         "fix": "Remove email from getMembers() SELECT query; return only display_name and avatar_url; log access for audit"},
        {"severity": "P1", "domain": "privacy", "category": "Compliance basics",
         "file": "apps/api/src/modules/auth/routes.ts",
         "issue": "GDPR delete route does not clean up audit_logs or consent_logs — user's data remains after account deletion",
         "impact": "GDPR Right to Erasure not fully implemented; user's audit trail and consent records persist after deletion",
         "fix": "Add explicit deletion of audit_logs and consent_logs entries for the user in the GDPR delete endpoint"},
        {"severity": "P1", "domain": "privacy", "category": "PII in logs",
         "file": "apps/api/src/modules/workspaces/routes.ts",
         "issue": "User email logged in workspace list operations via userEmail in authenticate middleware — PII in structured logs",
         "impact": "Email addresses flow into production log aggregation services where retention may be long and access broad",
         "fix": "Log only userId, not userEmail; if email is needed for debugging, mask it (e.g., j***@example.com)"},
        {"severity": "P1", "domain": "privacy", "category": "Access controls",
         "file": "apps/api/src/modules/auth/service.ts",
         "issue": "User search endpoint returns email in search results — GET /v1/auth/search?q= partial email search enabled",
         "impact": "Email enumeration via search — attacker can probe if specific email addresses have accounts on the platform",
         "fix": "Exclude email from search results entirely; search only by display_name; rate-limit search to 10 queries/min/user"},
        {"severity": "P2", "domain": "privacy", "category": "Retention",
         "file": "",
         "issue": "No data retention policy enforced — audit_logs and notifications grow unbounded; no scheduled purge exists",
         "impact": "User data retained indefinitely; GDPR 'right to be forgotten' lifecycle not implemented; storage grows without bound",
         "fix": "Implement pg_cron scheduled job to purge audit_logs > 90 days, notifications > 30 days, consent_logs > 1 year; document retention periods"},
        {"severity": "P2", "domain": "privacy", "category": "PII handling",
         "file": "",
         "issue": "avatar_url stored as raw TEXT with no validation — could contain tracking pixels or external references that leak user activity",
         "impact": "Third-party tracking via avatar URLs: when email clients load avatars, referer headers leak workspace context",
         "fix": "Proxy avatar images through API server; add Content-Security-Policy: img-src 'self'; validate avatar URLs against allowlist"},
        {"severity": "P3", "domain": "privacy", "category": "Compliance basics",
         "file": "",
         "issue": "No data processing register or GDPR compliance documentation in repository",
         "impact": "Cannot demonstrate GDPR compliance without documented data processing activities",
         "fix": "Create docs/compliance/gdpr-data-processing-register.md listing all PII fields, processing purposes, retention periods, and lawful bases"}
    ]
})

# ============================================================
# 7. CI/CD Security Ultra
# ============================================================
prompts.append({
    "prompt_name": "ci_cd_security_ultra",
    "domain": "ci_cd",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 2, "P1": 3, "P2": 2, "P3": 1},
    "category_scores": {"secret_handling": 30, "permissions": 40, "branch_protection": 25, "approval_gates": 35, "path_filtering": 45},
    "readiness": 35.0,
    "findings": [
        {"severity": "P0", "domain": "ci_cd", "category": "Secret handling",
         "file": ".github/workflows/deploy-production.yml",
         "issue": "Cloudflare origin cert and private key written to disk via echo heredoc — multi-line secrets can appear in GitHub Actions logs if shell fails",
         "impact": "TLS private key and origin certificate could be exposed in CI logs, compromising TLS security for the production domain",
         "fix": "Use GitHub Actions secrets directly in environment files ($GITHUB_ENV), or write secrets to files using GitHub Actions file commands"},
        {"severity": "P0", "domain": "ci_cd", "category": "Secret handling",
         "file": ".github/workflows/deploy-development.yml",
         "issue": "CI/CD secrets injected into .env files via inline echo commands — shell parsing errors can expose secrets in build logs",
         "impact": "Multiple secrets (Supabase keys, VAPID keys) could appear in CI logs if shell expansion fails",
         "fix": "Use env: block in docker compose or GitHub Actions environment files; avoid echo-based secret injection"},
        {"severity": "P1", "domain": "ci_cd", "category": "Permissions",
         "file": ".github/workflows/",
         "issue": "Workflows do not declare explicit GITHUB_TOKEN permissions — defaulting to write-all broad permissions",
         "impact": "If a workflow is compromised (e.g., via malicious PR), the GITHUB_TOKEN has write access to all repository resources",
         "fix": "Add explicit permissions: block to every workflow: contents: read, issues: read, pull-requests: read, actions: read"},
        {"severity": "P1", "domain": "ci_cd", "category": "Approval gates",
         "file": ".github/workflows/deploy-production.yml",
         "issue": "No production approval gate — push to main or workflow_dispatch immediately deploys to production without manual approval step",
         "impact": "Any code merged to main or anyone with dispatch access can deploy to production with zero human review",
         "fix": "Add environment: production with required reviewers to the deploy job; add 'prod-approval' environment protection rule in GitHub"},
        {"severity": "P1", "domain": "ci_cd", "category": "Branch protection",
         "file": "",
         "issue": "GitHub branch protection rules are not actually enforced — validate.yml only read-checks but doesn't apply them; no required status checks on main",
         "impact": "PRs can merge to main without passing lint, tests, or audit gates; no CI enforcement at all",
         "fix": "Configure branch protection via Terraform github_branch_protection resource or GitHub API; add audit-gate as required check"},
        {"severity": "P2", "domain": "ci_cd", "category": "Secret handling",
         "file": ".github/workflows/deploy-production.yml",
         "issue": "GITHUB_TOKEN piped to docker login via echo — full token exposed in SSH session commands",
         "impact": "GITHUB_TOKEN with write:packages scope visible in SSH history; could be harvested from compromised droplet",
         "fix": "Pass GITHUB_TOKEN as environment variable to SSH script instead of inlining in command"},
        {"severity": "P2", "domain": "ci_cd", "category": "Path filtering",
         "file": ".github/workflows/",
         "issue": "deploy-production.yml triggers on any push to main — no path filtering to ensure only relevant changes trigger a production deploy",
         "impact": "A README change to main triggers a full production deploy with image build, SSH, and container restart",
         "fix": "Add paths filter to deploy-production.yml trigger: paths: ['apps/', 'packages/', 'infra/', 'supabase/', 'scripts/']"},
        {"severity": "P3", "domain": "ci_cd", "category": "Artifact handling",
         "file": "",
         "issue": "No artifact retention policy documented — build artifacts use GitHub Actions defaults (90 days)",
         "impact": "Build artifacts with potentially sensitive intermediate data retained unnecessarily",
         "fix": "Set artifact retention to 7 days for CI builds, 30 days for release builds; document retention policy"}
    ]
})

# ============================================================
# 8. Platform Evolution Ultra
# ============================================================
prompts.append({
    "prompt_name": "evolution_ultra",
    "domain": "evolution",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 2, "P1": 3, "P2": 3, "P3": 2},
    "category_scores": {"ux_gaps": 35, "performance": 30, "architectural_efficiency": 30, "tech_debt": 40},
    "readiness": 34.0,
    "findings": [
        {"severity": "P0", "domain": "evolution", "category": "UX gaps",
         "file": "apps/web/components/chat/message-list.tsx",
         "issue": "Message list renders all messages as flat DOM — no virtualization, no inverted scroll, no scroll anchoring",
         "impact": "Channels with 1000+ messages freeze browser; users cannot load older messages via infinite scroll; scroll position lost on new messages",
         "fix": "Implement @tanstack/react-virtual with inverted scroll, scroll anchoring via IntersectionObserver, cursor-based pagination"},
        {"severity": "P0", "domain": "evolution", "category": "Architectural inefficiency",
         "file": "apps/api/src/modules/notifications/",
         "issue": "No worker for notification fanout — notification creation and push delivery happen synchronously in the API request thread",
         "impact": "Sending a message that @mentions 50 users blocks the API response for 50 push notification attempts; request latency scales linearly with mention count",
         "fix": "Move notification creation and push delivery to background worker (apps/worker/) using Redis-backed job queue (BullMQ)"},
        {"severity": "P1", "domain": "evolution", "category": "Performance bottlenecks",
         "file": "",
         "issue": "No caching layer for frequently accessed data (workspace list, channel list, user profiles) — every page load queries Supabase",
         "impact": "Every navigation triggers a Supabase query; no read-through cache for chat-loading patterns",
         "fix": "Add Redis cache for workspace/channel list and user profiles with 60s TTL; implement cache invalidation on mutations"},
        {"severity": "P1", "domain": "evolution", "category": "Architectural inefficiency",
         "file": "apps/api/src/lib/socket.ts",
         "issue": "Socket.io configured without Redis adapter for multi-instance deployments — only works with single API server",
         "impact": "Cannot horizontally scale API server; WebSocket state is per-process; messages from one instance not broadcast to sockets on another",
         "fix": "Implement Socket.io Redis adapter for cross-instance event broadcasting; configure Redis pub/sub channels"},
        {"severity": "P1", "domain": "evolution", "category": "UX gaps",
         "file": "",
         "issue": "No global command palette (Ctrl+K) — users must navigate via sidebar for every context switch",
         "impact": "Power users cannot quickly search and navigate to channels, users, or settings via keyboard",
         "fix": "Implement Ctrl+K command palette with fuzzy search across channels, recent DMs, users, settings; keyboard-navigable"},
        {"severity": "P2", "domain": "evolution", "category": "Tech debt",
         "file": "packages/db/src/types.ts",
         "issue": "TypeScript types severely out of sync with DB schema — 6 interfaces defined vs 16 tables",
         "impact": "Developers forced to use 'any'; no type safety; schema changes require manual type updates",
         "fix": "Regenerate types via supabase gen types typescript; add CI check for drift; create shared types package"},
        {"severity": "P2", "domain": "evolution", "category": "Performance bottlenecks",
         "file": "apps/web/app/",
         "issue": "All 9 pages use 'use client' — no React Server Components; no route-level code splitting",
         "impact": "Full JS bundle downloaded on every navigation; no streaming SSR; slow initial load on all pages",
         "fix": "Convert landing, workspace list to server components; use next/dynamic for ChatView, ThreadPanel, SettingsPage"},
        {"severity": "P2", "domain": "evolution", "category": "Architectural inefficiency",
         "file": "apps/api/src/app.ts",
         "issue": "No response caching middleware — identical requests (e.g., workspace list) re-query Supabase on every request",
         "impact": "Unnecessary DB load on read-heavy endpoints; no stale-while-revalidate pattern",
         "fix": "Implement response cache middleware with in-memory cache and configurable TTL per route pattern"},
        {"severity": "P3", "domain": "evolution", "category": "UX gaps",
         "file": "",
         "issue": "No loading.tsx in route groups — no Suspense fallback for page transitions",
         "impact": "Page transitions show blank screen or nothing while data loads",
         "fix": "Add loading.tsx with Skeleton components to each route group: (workspace), (auth)"},
        {"severity": "P3", "domain": "evolution", "category": "Tech debt",
         "file": "",
         "issue": "No empty state components for workspace list, channel list, message list, search results",
         "impact": "When data is empty, users see blank panels with no guidance on next action",
         "fix": "Create reusable EmptyState component; add to workspace list ('Create your first workspace'), channel list ('No channels yet'), search ('No results found')"}
    ]
})

# ============================================================
# WRITE ALL FILES AND INGEST
# ============================================================
for p in prompts:
    name = p["prompt_name"]
    path = OUTPUTS / f"{name}.json"
    path.write_text(json.dumps(p, indent=2, default=str), encoding="utf-8")
    print(f"Written: {path.name} ({len(p['findings'])} findings, P0={p['severity_counts']['P0']})")

print(f"\nTotal: {len(prompts)} prompts")

# Ingest each
print("\n--- Ingesting ---")
for p in prompts:
    name = p["prompt_name"]
    path = OUTPUTS / f"{name}.json"
    result = subprocess.run(
        [sys.executable, str(INGEST), "--prompt-name", name, "--output-file", str(path)],
        capture_output=True, text=True, cwd=str(REPO)
    )
    if result.returncode == 0:
        parsed = json.loads(result.stdout)
        print(f"  {name}: OK (run_id={parsed['run_id']}, findings={parsed['finding_count']})")
    else:
        print(f"  {name}: FAILED - {result.stderr.strip()}")
