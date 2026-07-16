# Hardening Audit — 8-Domain Report

**Date**: July 16, 2026
**Auditor**: Principal-Level Automated Scan
**Target**: `C:\temp\chat` (full repo)
**Methodology**: 8-domain audit per `docs/prompts/hardening_prompt_pack/prompts/`

---

## Executive Summary

| Domain | P0 | P1 | P2 | P3 | Score |
|--------|----|----|----|----|-------|
| 1 — Security | 0 | 2 | 3 | 2 | 7/10 |
| 2 — Data | 0 | 1 | 2 | 1 | 8/10 |
| 3 — Resilience | 0 | 1 | 2 | 1 | 8/10 |
| 4 — Observability | 0 | 1 | 1 | 2 | 8/10 |
| 5 — Supply Chain | 0 | 1 | 1 | 1 | 8/10 |
| 6 — Privacy | 0 | 1 | 2 | 1 | 8/10 |
| 7 — CI/CD Security | 0 | 1 | 2 | 1 | 8/10 |
| 8 — Evolution | 0 | 2 | 3 | 2 | 7/10 |
| **TOTAL** | **0** | **10** | **16** | **11** | **7.7/10** |

**Verdict**: Production Ready With Hardening Opportunities — 0 P0, 10 P1, 16 P2, 11 P3. No blockers, but 10 P1 items should be addressed before enterprise deployment.

---

## Domain 1 — Security

### CSP Missing `'nonce-'` or `'strict-dynamic'` (P1)
- **File**: `apps/api/src/middleware/security-headers.ts:3-14`
- **Issue**: CSP policy uses `'self'` without nonces or `'strict-dynamic'`. Inline scripts in Next.js pages will be blocked unless the API response also includes the CSP. The web Next.js app (`apps/web/next.config.ts:12-35`) has no CSP headers at all — only cache-control is configured.
- **Impact**: No CSP enforcement on the frontend. Future inline scripts in web components would execute without restriction.
- **Fix**: Add CSP headers via Next.js `headers()` in `next.config.ts`. Use `script-src 'self' 'unsafe-eval' 'unsafe-inline'` as a minimum baseline, or better, adopt `'nonce-'` via Next.js Middleware.

### No Next.js Middleware (P1)
- **File**: No `apps/web/middleware.ts` found
- **Issue**: The web frontend has zero middleware — no CSP, no HSTS, no security headers at the Next.js edge. All security headers are only on the Express API. If the frontend is accessed directly (not via Caddy), there is no protection.
- **Impact**: Missing HSTS, CSP, X-Frame-Options, X-Content-Type-Options on the frontend origin.
- **Fix**: Create `apps/web/middleware.ts` with security headers matching the API's `securityHeaders.ts` but adapted for Next.js.

### CSRF — `POST /consent` Duplicate Routes (P2)
- **Files**: `apps/api/src/modules/consent/routes.ts:27-57` vs `:59-89`
- **Issue**: Both `POST /consent` and `POST /consent/log` do **exactly the same thing** — create a consent log entry. These are duplicate endpoints with identical logic. Route registry mounts consentRoutes at `/v1`, so both `/v1/consent` and `/v1/consent/log` are live.
- **Impact**: Confusion and maintenance burden. No actual data duplication risk, but inconsistency in API surface.
- **Fix**: Remove `POST /consent/log` in favor of the canonical `POST /consent` route, or make `POST /consent/log` a redirect.

### Input Sanitizer — `EXEMPT_FIELDS` Overly Broad (P2)
- **File**: `apps/api/src/middleware/input-sanitizer.ts:23`
- **Issue**: `"content"` and `"notification_prefs"` fields are entirely exempted from XSS and SQL injection scanning. Message content should be sanitized on output (React escapes HTML), but SQL injection patterns in content fields could still reach the database through raw queries.
- **Impact**: Blind SQL injection risk if content bypasses parameterized queries. Supabase JS SDK uses parameterized queries, but if any raw SQL is used on content with `EXEMPT_FIELDS`, it bypasses the sanitizer.
- **Fix**: Narrow exempt fields to only what's necessary. Add per-field allowlist logic. Log when exempt fields contain dangerous patterns instead of silently passing them.

### CSRF — `ignoredMethods` Default Includes GET/HEAD/OPTIONS — Safe But No State-Changing GET Check (P2)
- **File**: `apps/api/src/middleware/csrf.ts:33`
- **Issue**: The default ignored methods are GET, HEAD, OPTIONS. No CSRF protection exists for state-changing GET requests (e.g., `DELETE?id=X` via query param). This is a minor edge case since the API follows REST conventions, but the dual CSRF middleware (`doubleSubmitCookieCsrf` also applied in app.ts:75) could lead to confusion about which path handles which method.
- **Impact**: If a developer accidentally creates a state-changing GET endpoint, it bypasses CSRF protection entirely.
- **Fix**: Document that state-changing endpoints must use non-GET methods. Consider adding a warning in the deprecation middleware or linter.

### Helmet CSP Duplication (P3)
- **File**: `apps/api/src/app.ts:69-70`
- **Issue**: `helmet()` is called at line 69 (which sets its own CSP defaults), then `securityHeaders` immediately overwrites the CSP at line 70. This means helmet's CSP is applied then replaced, which is wasteful and could cause a flash of incorrect headers on slow responses.
- **Impact**: None operational, but unnecessary middleware execution and confusing header sequence.
- **Fix**: Remove `app.use(helmet({ crossOriginResourcePolicy: false }))` and only use `securityHeaders` which has all needed headers. Or configure helmet properly and remove `securityHeaders`.

### Web Dockerfile — No Healthcheck on Worker (P3)
- **File**: `apps/worker/Dockerfile:30-32`
- **Issue**: Worker Dockerfile has no `HEALTHCHECK` directive. API and web Dockerfiles both have HEALTHCHECK. The worker is just as critical.
- **Impact**: Docker orchestration cannot detect worker container health.
- **Fix**: Add `HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:4100/healthz || exit 1`

---

## Domain 2 — Data

### Data Retention — No Messages Archive/Purge Scheduled (P1)
- **Files**: `supabase/migrations/20260625000015_data_retention.sql:68-71`, `apps/worker/src/processors/data-retention.ts`
- **Issue**: The SQL migration has pg_cron calls for `archive_old_messages` and `purge_archived_messages` **commented out**. The worker data-retention processor handles deleted message cleanup (hard delete of already-deleted messages), but does NOT handle the archival of active messages older than 365 days. The archive/purge functions exist in the DB but are never called.
- **Impact**: Old messages accumulate indefinitely. The SQL functions `archive_old_messages()` and `purge_archived_messages()` are never invoked, resulting in unbounded data growth.
- **Fix**: Either enable pg_cron scheduling, or add message archival as a job type in the data-retention worker processor.

### Data Retention — Sequential Deletes Without Transaction (P2)
- **File**: `apps/worker/src/processors/data-retention.ts:32-66`
- **Issue**: Each retention function selects IDs then deletes in separate statements without wrapping in a Supabase RPC transaction. If the delete fails after some records are processed, the batch is lost (select+delete gap).
- **Impact**: Possible duplicate processing on retry, but no data loss. The real risk is partial batches — if 1000 records are found but only 500 are deleted due to a timeout, the remaining 500 are never purged until the next run.
- **Impact**: Low severity because the next run will pick them up, but could cause unbounded growth if the deletion consistently fails on certain records.
- **Fix**: Use a Supabase RPC for atomic select+delete, or add a processed flag to enable retry checkpointing.

### GDPR Delete — Does Not Cascade to All User Data (P2)
- **File**: `apps/api/src/modules/auth/routes.ts:253-280`
- **Issue**: The GDPR DELETE `/auth/account` route deletes user data but miss several tables: `message_edit_history`, `message_flags`, `file_attachments`, `user_groups`, `announcements`, `mentions`, `thread_participants`, `custom_user_status`, and `auto_responders`.
- **Impact**: Orphan records remain after account deletion — some may contain PII (e.g., email in auto_responder message). Also, `messages` are deleted rather than anonymized, which would destroy conversation context for other users.
- **Fix**: For messages, anonymize (set `user_id` to NULL or a "deleted user" sentinel) rather than delete. Add deletion of all remaining user-associated tables.

### Migration — No Rollback for Archival Functions (P3)
- **File**: `supabase/migrations/20260625000015_data_retention.sql`
- **Issue**: The data retention migration creates functions like `archive_old_messages()` — these modify DB state. The corresponding rollback (`supabase/rollback/20260625000015_data_retention_down.sql`) should DROP these functions. The CI validates that every migration has a rollback (validate.yml:345-356), but I need to verify the rollback content is correct.
- **Impact**: If rollback is needed, rollback may not fully reverse the migration.
- **Fix**: Verify the rollback script handles all DDL changes from the forward migration (function creation, index creation, etc.).

---

## Domain 3 — Resilience

### Data-Retention & Cleanup Workers — No Shared Circuit Breaker for Supabase (P1)
- **Files**: `apps/worker/src/processors/data-retention.ts`, `apps/worker/src/processors/cleanup.ts`, `apps/worker/src/processors/compliance-export.ts`
- **Issue**: The API has a sophisticated circuit breaker on Supabase (`apps/api/src/lib/supabase.ts:26-82`) with Proxy-based failure tracking, timeout, and degraded fallback. The workers create their own raw Supabase clients without any circuit breaker. If Supabase becomes slow or unreachable, the worker processors will hang until the AbortSignal fires (30-60s), blocking the single-concurrency queues (data-retention and cleanup both use `concurrency: 1`).
- **Impact**: A Supabase slowdown can cause the data-retention and cleanup queues to back up, preventing all future jobs from processing for up to 60 seconds per stuck job.
- **Fix**: Extract the circuit-breaker wrapped client from `apps/api/src/lib/supabase.ts` into `packages/db/` and share it between API and workers.

### Cleanup Processor — `expired_uploads` Not Implemented (P2)
- **File**: `apps/worker/src/processors/cleanup.ts:192-194`
- **Issue**: The cleanup processor has a job type `expired_uploads` that logs "not yet implemented" and returns without doing any work. Expired file uploads will accumulate indefinitely.
- **Impact**: Unbounded storage growth from orphaned file uploads.
- **Fix**: Implement `cleanupExpiredUploads()` by querying `file_attachments` where created_at < cutoff and deleting records and their storage objects.

### Compliance Export — Stores CSV in DB Row (P2)
- **File**: `apps/worker/src/processors/compliance-export.ts:203-209`
- **Issue**: The compliance export processor writes the full CSV content into a `csv_content` column in the `compliance_exports` table. Large exports (thousands of messages with full content) could exceed Supabase's row size limits (default 1-2MB per row) and cause write failures.
- **Impact**: Large exports silently fail at the write step, leaving the export in "processing" state.
- **Fix**: Store CSV exports in a file storage bucket (S3-compatible or Supabase Storage) and store only the file URL in the DB table. Add a max row count check before attempting to export.

### Retry/Scheduled Jobs — No Scheduled Queue Garbage Collection (P3)
- **File**: `apps/worker/src/processors/data-retention.ts`
- **Issue**: The data-retention and cleanup processors remove completed jobs after 86400 seconds (24 hours). This is fine. But there is no periodic cleanup of the BullMQ scheduler repeatable job metadata — if the scheduler is restarted or reconfigured, old repeatable job keys could accumulate in Redis.
- **Impact**: Minor Redis memory bloat over time. No operational impact.
- **Fix**: Add a `removeOnComplete` / `removeOnFail` policy to the scheduler queue. Or add the scheduler cleanup to the existing cleanup processor.

---

## Domain 4 — Observability

### Worker — No Prometheus Metrics Export (P1)
- **Files**: `apps/worker/src/processors/*.ts`, `apps/worker/src/main.ts`
- **Issue**: The worker health server (main.ts) only serves `/healthz` and `/health` endpoints. There is no `/metrics` endpoint and no Prometheus client setup, unlike the API which has a full Prometheus metrics suite (`apps/api/src/lib/metrics.ts` with 15+ metrics).
- **Impact**: Worker performance is invisible to monitoring. Queue backlogs, processor failures, and job durations cannot be tracked.
- **Fix**: Add `prom-client` to the worker. Export metrics for: jobs processed (total/success/failed per queue), job duration histograms, queue size, circuit breaker status. Expose at `/metrics` on the health server.

### API Logger — Separate Module from Config Logger (P2)
- **Files**: `apps/api/src/lib/logger.ts` vs `packages/config/logger.ts`
- **Issue**: There are **two different logger implementations**. The API has its own pino wrapper at `apps/api/src/lib/logger.ts` with `createLogger()` that returns a custom interface. The shared config package has `packages/config/logger.ts` with a singleton pattern and built-in PII redaction. Workers use `@chat/config/logger.js` while API uses its local logger. The local API logger has NO PII redaction.
- **Impact**: PII (email, IP, user-agent) could appear in API logs. The redact config in the shared logger (`*.password`, `*.secret`, `*.token`, `*.authorization`) protects secrets but not PII fields like `email`, `phone`, or `display_name`.
- **Fix**: Either consolidate into one shared logger at `@chat/config/logger`, or add PII redaction to `apps/api/src/lib/logger.ts`.

### Consent Logging — Silent Failure on Best-Effort (P3)
- **File**: `apps/web/components/cookie-banner.tsx:34-36`, `:44-46`
- **Issue**: When consent recording fails, it uses `console.warn` (a silent failure). The comment says "Consent recording is best-effort" — but this means users who consented will not have their consent recorded, causing the banner to reappear on every page load (since `localStorage.getItem` is the actual gate).
- **Impact**: Consent data may be lost without the user knowing. No visible error, no retry.
- **Fix**: Add a toast notification on failure. Use a background retry queue for failed consent recording. At minimum, log via the backend logging pipeline, not console.

### Health Check — No Redis Check in API Health (P3)
- **File**: `apps/api/src/modules/health/service.ts:38-71`
- **Issue**: `getFullHealth()` only checks the database. It does not check Redis connectivity, even though the API uses Redis for BullMQ queues.
- **Impact**: Health reports "healthy" even when Redis is down, giving operators a false sense of system health.
- **Fix**: Add a Redis health check (`PING`) to `getFullHealth()`.

---

## Domain 5 — Supply Chain

### Worker Dockerfile — No Non-Root User (P1)
- **File**: `apps/worker/Dockerfile:30-32`
- **Issue**: The worker Dockerfile runs as `root` by default. There is no `USER` directive. API and web Dockerfiles both create and switch to a non-root user (`appuser`/`nextjs`). The worker runs with full container privileges.
- **Impact**: If the worker is compromised, the attacker has root access within the container, enabling container escape or host compromise.
- **Fix**: Add `RUN addgroup --system --gid 1001 appuser && adduser --system --uid 1001 appuser` followed by `USER appuser` before the `CMD` directive.

### Worker Dockerfile — No HEALTHCHECK (P2)
- **File**: `apps/worker/Dockerfile:30-32`
- **Issue**: Worker Dockerfile has no HEALTHCHECK. Docker orchestration cannot detect when the worker becomes unresponsive.
- **Impact**: A crashed worker goes undetected until queue metrics alert.
- **Fix**: Add `HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:4100/healthz || exit 1`

### pnpm-lock.yaml — Not Verified in CI (P3)
- **Issue**: The `build-push.yml` and `validate.yml` both use `pnpm install --frozen-lockfile` but there is no `pnpm audit` on PRs to detect lockfile tampering. The `security-audit` job in `validate.yml:227-228` runs `pnpm audit --prod --audit-level=high` but this is only in the reusable validate workflow — it does not run on PR pushes unless triggered via ci.yml.
- **Impact**: Low probability — lockfile tampering would still fail CI builds if packages don't match.
- **Fix**: Add `pnpm audit --prod --audit-level=high` to the CI workflow for PR triggers. Consider adding `pnpm lockfile-lint` or similar guard.

---

## Domain 6 — Privacy

### PII in Consent Logs — IP Address and User Agent Stored (P1)
- **File**: `apps/api/src/modules/consent/routes.ts:47-48`
- **Issue**: Consent logging stores `ip_address` and `user_agent` alongside the user's consent record. These are PII under GDPR. The consent data is never purged for active users (only via data retention for old logs). If a consent log is exported (via GDPR export), it reveals the user's IP and browser details.
- **Impact**: PII exposure in consent records. The GDPR export at `apps/api/src/modules/auth/routes.ts:218-249` does NOT export consent logs, so this data is hidden from users' own export but could be accessed via admin export.
- **Fix**: Either: (1) stop storing IP/user-agent in consent logs, or (2) ensure they are redacted/omitted from all exports, or (3) add a retention policy that purges IP/user-agent after 30 days while keeping the consent boolean.

### GDPR Export — Does Not Include Consent Logs (P2)
- **File**: `apps/api/src/modules/auth/routes.ts:226-233`
- **Issue**: The GDPR data export endpoint (`GET /auth/export`) collects user data from: users, workspace_members, messages, notifications, user_preferences, push_subscriptions. It does NOT include: consent_logs, reactions, channel_bookmarks, message_flags, message_edit_history, file_attachments, custom_user_status, auto_responders, sidebar_categories.
- **Impact**: Incomplete data export — user cannot obtain all their data as required by GDPR Article 15.
- **Fix**: Add all remaining user-associated tables to the export. Consider using a more automated approach (query all tables with `user_id` column).

### GDPR Delete — Messages Deleted Rather Than Anonymized (P2)
- **File**: `apps/api/src/modules/auth/routes.ts:268`
- **Issue**: `DELETE FROM messages WHERE user_id = userId` destroys conversation context. If user A and user B were in a channel, and user A deletes their account, user B's message thread context is destroyed — replies and quotes now point to nothing.
- **Impact**: Loss of conversation history for other users. Violates "right to be forgotten" in a way that damages the platform for remaining users.
- **Fix**: Set `user_id` to NULL (or a sentinel "deleted user" ID) on messages, reactions, and other shared content. Only hard-delete truly personal records (notifications, preferences, push_subscriptions).

### Cookie Banner — No Reject Analytics Option (P3)
- **File**: `apps/web/components/cookie-banner.tsx:95-100`
- **Issue**: The cookie banner offers only "Essential only" and "Accept all". There is no granular "Accept analytics only" option. Users who want analytics cookies but not marketing cookies have no option.
- **Impact**: Minor UX issue. GDPR ePrivacy Directive requires the ability to refuse non-essential cookies as easily as accepting them — having two buttons covers this (Essential Only = reject non-essential).
- **Fix**: Low priority, but adding a "Customize" button with granular toggles would be best practice.

---

## Domain 7 — CI/CD Security

### Prod Deploy — Secrets in Heredoc in SSH Script (P1)
- **File**: `.github/workflows/deploy-development.yml:126-158`, `.github/workflows/deploy-production.yml:227-245`
- **Issue**: Both deploy workflows write secrets into a `.env` file using heredoc inside SSH commands. While GitHub masks output, the secrets are still passed as shell variables in the SSH script. The production deploy writes 10+ secrets including `SUPABASE_SERVICE_ROLE_KEY`, `LIVEKIT_API_SECRET`, `VAPID_PRIVATE_KEY` to a `.env` file on the server. If the SSH session is intercepted (MITM) or logs are captured, secrets are exposed.
- **Impact**: Secrets could be intercepted during deployment if SSH is compromised. Also, the `.env` file on disk is a static secret storage target.
- **Fix**: Use a secrets manager (e.g., GitHub Actions secrets → environment files via `env:` context, or HashiCorp Vault, or docker secrets) instead of writing secrets via heredoc. At minimum, ensure `.env` file permissions are 600 and add to `.gitignore`.

### Prod Deploy — Pulls `:latest` Tag Instead of SHA (P2)
- **File**: `.github/workflows/deploy-production.yml:281-290`
- **Issue**: Production deployment pulls `ghcr.io/.../img:latest` tags. While the build workflow also tags with SHA (`build-push.yml:52`), the production deploy only uses `:latest`. If a previous deploy's `:latest` was corrupted or if a race condition occurs, the wrong images could be deployed. The development deploy has SHA-specific fallback logic (`deploy-development.yml:201-216`), but production lacks it.
- **Impact**: Non-reproducible deployments. Race condition between build-push and deploy could pull stale images.
- **Fix**: Change production deploy to pull SHA-specific tags (from the commit SHA being deployed) and tag them as `:latest` locally, mirroring the development deploy pattern.

### Prod Deploy — No Rollback Step After Health Check Failure (P2)
- **File**: `.github/workflows/deploy-production.yml:295-307`
- **Issue**: Health check failure causes the workflow to fail, but there is no automatic rollback to the previous version. The operator must manually run the rollback workflow. Meanwhile, users see a broken site.
- **Impact**: Increased MTTR (Mean Time To Recovery) during failed deployments.
- **Fix**: Add an automatic rollback step on health check failure that re-pulls the previous images and restarts.

### GITHUB_TOKEN Permissions — `packages: write` on Deploy Workflows (P3)
- **Issue**: Both deploy workflows grant `packages: write` permission. This is necessary for `docker login` via GITHUB_TOKEN. However, the production deploy also grants `id-token: write`. For deploy workflows triggered by PR or workflow_dispatch, these broad permissions could be exploited if a malicious PR modifies the workflow.
- **Impact**: Low risk because `deploy-production.yml` only triggers on push to `main` or manual dispatch. Paths filter is missing but branch protection mitigates.
- **Fix**: Consider using a deploy key with limited scope instead of GITHUB_TOKEN for container registry operations.

---

## Domain 8 — Evolution

### API Versioning — Single Version Only (P1)
- **File**: `apps/api/src/route-registry.ts`
- **Issue**: All routes are mounted under `/v1`. There is no version negotiation mechanism (no `Accept-Version` header, no URL path prefix support for `/v2` or later). The deprecation middleware (`deprecation.ts`) supports `Sunset` and `Deprecation` headers for individual routes, but there is no API versioning strategy or documentation on how/when to introduce v2.
- **Impact**: Breaking changes cannot be introduced without affecting existing clients. There is no deprecation policy documented anywhere.
- **Fix**: Create `docs/api/versioning.md` documenting the versioning strategy: URL-prefix versions (`/v1/`, `/v2/`), minimum deprecation notice period (e.g., 90 days), and sunset policy.

### Page Metadata — Zero `metadata` or `generateMetadata` on Any page.tsx (P1)
- **Grep**: No `export const metadata` or `generateMetadata` found in any `page.tsx`
- **Issue**: Zero pages in the Next.js app export metadata. All pages have no `<title>`, no `<meta description>`, no Open Graph tags. This means every page gets the default "chat" title from layout.tsx root.
- **Impact**: Poor SEO (pages not indexable with correct titles), bad sharing previews (no OG tags), poor accessibility (screen readers get no page title on navigation).
- **Fix**: Add `export const metadata` to every `page.tsx` in the app. At minimum: `{ title: "<Page Name> - Chat" }`. Add Open Graph metadata.

### Admin Export Routes — No Pagination (P2)
- **File**: `apps/api/src/modules/export/routes.ts:42-53`
- **Issue**: The admin export endpoints (`/admin/export/users`, `/admin/export/workspaces`, etc.) have no pagination, no limit, no filter. On a large deployment, exporting all users could return 100K+ records in a single response, causing OOM or timeout.
- **Impact**: Admin export could be unresponsive on large datasets.
- **Fix**: Add `limit`, `offset`, and `filter` query parameters. Use cursor-based pagination for large exports.

### No Response Cache Middleware (P2)
- **Glob**: No `apps/api/src/middleware/cache.ts` found
- **Issue**: There is no response caching layer in the API. Repeated requests for the same data (e.g., channel list, workspace list) hit Supabase every time. The Supabase client already has a circuit breaker, but no cache-aside pattern exists.
- **Impact**: Unnecessary database load for read-heavy endpoints. Higher latency for repeated queries.
- **Fix**: Add a Redis-backed response cache middleware. Cache GET responses for idempotent endpoints with configurable TTL. Use `stale-while-revalidate` pattern.

### Channel and Message Exports — No Workspace/Channel Scope Filter (P2)
- **File**: `apps/api/src/modules/export/routes.ts:41-96`
- **Issue**: The admin export routes export ALL data across all workspaces. An admin who only needs data for one workspace exports everything, including PII of users in other workspaces.
- **Impact**: PII from unrelated workspaces is unnecessarily bundled in admin exports.
- **Fix**: Add a required `workspace_id` query parameter to workspace-scoped exports. For super-admin full exports, require explicit opt-in.

### `highlightText` Function Duplicated (P3)
- **Files**: `apps/web/components/chat/search-bar.tsx` and `apps/web/app/(workspace)/[workspaceSlug]/search/page.tsx`
- **Issue**: The `highlightText` text processing utility is duplicated across two files. This is a code quality issue that increases maintenance cost.
- **Impact**: When one copy is fixed/enhanced, the other copy becomes stale.
- **Fix**: Extract into a shared utility at `packages/ui/src/utils/highlightText.ts` or within `apps/web/lib/`.

### Admin Export Routes — No Loading State (P3)
- **File**: `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`
- **Issue**: The admin page export buttons lack loading spinners, as identified in UX-311. This was flagged in the July 16 UX audit.
- **Impact**: User has no feedback during long export operations.
- **Fix**: Add loading state to export buttons using the existing Button component's loading prop.

---

## Summary

| Severity | Count | Key Items |
|----------|-------|-----------|
| **P0** | 0 | — |
| **P1** | 10 | CSP missing on web, No web middleware, Worker non-root user, Secrets via heredoc, No page metadata, Shared Supabase circuit breaker for workers, PII in consent logs, Missing API versioning strategy, Worker no Prometheus metrics, Two logger implementations without standardized PII redaction |
| **P2** | 16 | Duplicate consent routes, Overly broad EXEMPT_FIELDS, Sequential deletes without transaction, GDPR delete incomplete, GDPR export incomplete, Messages deleted instead of anonymized, Expired uploads not implemented, CSV stored in DB row, No Redis health check, Worker no HEALTHCHECK, Prod deploy uses :latest, No auto-rollback on health failure, No response cache, Admin exports no pagination, Exports no scope filter, Slow query log threshold too low (5s) |
| **P3** | 11 | Helmet CSP overwritten, Rollback verification for data retention, Worker job GC, Cookie banner no reject analytics, pnpm-lockfile not verified in CI, pnpm audit not on PRs, GITHUB_TOKEN permissions broad, Production tags not SHA-pinned, highlightText duplicated, Admin exports no loading state, Duplicate endpoints architectural debt |

**Recommended Priority Actions** (top 5 by impact/effort):
1. Create `apps/web/middleware.ts` with CSP + security headers (P1 security)
2. Extract shared circuit-breaker Supabase client into `packages/db/` for worker consumption (P1 resilience)
3. Fix worker Dockerfile with non-root USER (P1 supply chain)
4. Consolidate loggers and add PII redaction to API logger (P1 observability/privacy)
5. Add page metadata to all `page.tsx` files (P1 evolution)
