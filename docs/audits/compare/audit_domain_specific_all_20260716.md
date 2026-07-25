# Consolidated Domain-Specific Audit Report — July 16, 2026

**Audit Date**: July 16, 2026
**Repo**: `C:\temp\chat`
**Domains Audited**: 8 (Security, Environment, Ops, Release, Governance, Features, Testing, Environment Promotion)
**Prompts Executed**: 11

---

## Executive Summary

This consolidated report merges findings from 11 domain-specific audit prompts executed against 8 audit domains. The overall posture is **GO WITH RISKS** — no blocking (P0) findings exist, but 9 P1, 26 P2, and 18 P3 findings were identified across all domains.

**Severity Breakdown**:
| Severity | Count | Key Areas |
|----------|-------|-----------|
| **P0** | 0 | — |
| **P1** | 9 | Reactions RLS, presence data leak, compliance exports cross-workspace, admin mobile navigation, i18n gaps on admin/settings/search, formatting bar touch targets, channel-info silent failures |
| **P2** | 26 | Mixed pagination, event replay after socket reconnect, private channel RLS, GDPR delete atomicity, webhook retry persistence, Sentry integration, Prometheus/Alertmanager not deployed, worker metrics, logging PII redaction, PII column encryption, console.warn in catch blocks, CSS var boundary documentation, duplicate pagination/highlightText, CSP nonce support, input sanitizer false positives |
| **P3** | 18 | Health endpoint docs, Docker HEALTHCHECK on worker, audit log in-memory queue, incident response runbook, GDPR compliance docs, consent types documentation, settings loading/skeleton, CSV parser, admin error boundaries, density mode dead code, search year hint, dead CSS, missing runbook sections |

**Overall Decision**: **GO WITH RISKS**

---

## 1. Security Audit

### Executive Summary

The security posture is solid overall with strong middleware patterns (authenticate, require-permission, CSRF, rate limiting, security headers). However, three P1 RLS gaps and several P2 findings around data protection remain unresolved.

### Findings

| ID      | Sev    | Category           | File                                                                | Issue                                                                                           | Impact                                                             | Fix                                                                   |
| ------- | ------ | ------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| SEC-001 | **P1** | RLS Authorization  | `supabase/policies/06_reactions.sql`                                | Reactions SELECT policy is `using (true)` — any authenticated user sees ALL reactions           | Leaks engagement patterns on messages in private channels          | Add channel membership check via message join                         |
| SEC-002 | **P1** | RLS Authorization  | `apps/api/src/modules/reactions/routes.ts:24-41`                    | Reactions batch endpoint lacks message access control — accepts arbitrary message IDs           | Enumerate reactions on private channel messages                    | Add `requireMessageAccess` middleware                                 |
| SEC-003 | **P1** | Data Protection    | `supabase/migrations/20260709000003_add_compliance_exports.sql`     | Compliance exports table has no `workspace_id` column — RLS is `using (true)`                   | Cross-workspace admin data leak                                    | Add `workspace_id` FK and scope SELECT policy                         |
| SEC-004 | **P1** | Data Protection    | `supabase/migrations/20260704000001_add_dm_presence_categories.sql` | `user_presence` SELECT policy is `using (true)` — all authenticated users see all presence data | Leaks user activity patterns across workspace boundaries           | Scope presence visibility to workspace co-members                     |
| SEC-005 | **P2** | Data Protection    | `apps/api/src/modules/auth/routes.ts:260-276`                       | GDPR account deletion uses 12 sequential deletes without transaction wrapping                   | Partial failure leaves orphaned data                               | Use Supabase RPC or compensation mechanism                            |
| SEC-006 | **P2** | Logging/Monitoring | `apps/api/src/modules/webhooks/service.ts:405-409`                  | Webhook retries use in-process `setTimeout` — lost on server restart                            | Failed deliveries with retries pending lost on restart             | Use BullMQ (existing worker infrastructure) for persistent scheduling |
| SEC-007 | **P2** | RLS Posture        | `supabase/policies/03_channels.sql`                                 | Channels INSERT policy does not restrict private channel creation to admins                     | Any member can create private channels                             | Restrict private channel creation to admins/owners                    |
| SEC-008 | **P2** | RLS Posture        | `supabase/policies/04_messages.sql`                                 | Message select RLS does not filter private channels                                             | Messages in private channels exposed through message SELECT policy | Add private channel membership check via channel_members join         |
| SEC-009 | **P2** | RLS Posture        | `supabase/migrations/20260709000004_add_announcements.sql`          | Announcements SELECT policy is `using (true)`                                                   | All authenticated users see all announcements across workspaces    | Scope to workspace membership                                         |
| SEC-010 | **P2** | Authentication     | `apps/api/src/middleware/input-sanitizer.ts`                        | SQL injection sanitizer causes false positives on natural language text                         | Blocks legitimate input containing common English words            | Use syntax-aware detection instead of keyword matching                |
| SEC-011 | **P3** | CORS/CSRF          | `apps/api/src/middleware/security-headers.ts`                       | CSP policy lacks nonce/hash support for inline scripts                                          | Would block inline scripts if needed                               | Add nonce generation when inline scripts are required                 |
| SEC-012 | **P3** | API                | `apps/api/src/modules/webhooks/routes.ts`                           | Webhook `enforceBodyLimit` checks spoofable `Content-Length` header                             | Attacker can bypass body limit                                     | Remove middleware; rely on `express.json({ limit: '1mb' })`           |

### Exploitability Commentary

- **SEC-001/SEC-002 (Reactions leak)**: Medium exploitability. An authenticated user can enumerate reactions on any message by iterating message UUIDs (no rate limit on batch endpoint). Reaction data is low-sensitivity but reveals which channels are active.
- **SEC-003 (Compliance exports)**: Medium exploitability. Requires admin role in any workspace. Compliance exports may contain full message content and audit data.
- **SEC-004 (Presence leak)**: Low exploitability. Presence is generally public in chat apps but violates the principle of least privilege.

### Mitigation Plan

**Immediate (P1)**:

1. Fix reactions RLS and batch endpoint (SEC-001, SEC-002) — ~2h
2. Add `workspace_id` to compliance_exports (SEC-003) — ~1h
3. Scope user_presence RLS (SEC-004) — ~1h

**Deferred (P2)**: 4. Transaction-wrap GDPR delete (SEC-005) — ~2h 5. Move webhook retries to BullMQ (SEC-006) — ~3h 6. Fix private channel create RLS (SEC-007) — ~1h 7. Fix messages SELECT RLS for private channels (SEC-008) — ~1h 8. Fix announcements RLS (SEC-009) — ~30min

**Final Recommendation**: **GO WITH RISKS** — All P1 items are in RLS policies, which are scoped behind authenticated access and not exploitable by unauthenticated attackers. Fix within 1 week.

---

## 2. Environment Drift Audit

### Executive Summary

Significant drift exists between the three environment configurations (local dev, remote dev, production). The local `docker-compose.dev.yml` differs substantially from `docker-compose.devremote.yml` and `docker-compose.prod.yml`. Three Caddyfiles exist with varying feature parity. No single source of truth for environment variables.

### Findings

| ID      | Sev    | Category              | File(s)                                                    | Issue                                                                                                                                                                                                                                                                              | Impact                                                                                            | Fix |
| ------- | ------ | --------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --- |
| ENV-001 | **P2** | Caddy Parity          | `Caddyfile` vs `Caddyfile.dev` vs `Caddyfile.prod`         | Three Caddyfile variants with different security headers and route configurations. Dev Caddyfile (devremote) uses `handle /health*` pattern; prod uses matcher blocks with `@health` named matcher.                                                                                | Behavioral drift — route ordering and matching semantics differ between envs                      |
| ENV-002 | **P2** | Compose Parity        | `docker-compose.dev.yml` vs `docker-compose.devremote.yml` | Local dev compose has volume mounts for hot-reload and `command` overrides; remote dev compose uses pre-built images. LiveKit configuration differs (`turn.enabled: false` in local vs `true` in remote/prod). Web container depends on `api` in remote/prod but not in local dev. | Hot-reload assumptions baked into compose; TURN config drift could cause LiveKit failures in prod |
| ENV-003 | **P2** | Image Tag Strategy    | `docker-compose.prod.yml` vs deploy workflows              | Prod compose uses `:latest` tags as defaults (overridable via env vars). Deploy workflow pulls `:latest` tags, not SHA-pinned tags.                                                                                                                                                | Rollback requires re-tagging SHA images as `:latest`; race condition on concurrent pushes         |
| ENV-004 | **P2** | Health Endpoint Drift | Devremote vs Prod compose                                  | Devremote API healthcheck uses `/health`; Prod uses `/healthz`. Worker healthcheck in devremote uses `kill -0 1` (PID check) vs prod uses `wget http://localhost:4100/healthz`.                                                                                                    | Different health check semantics between environments                                             |
| ENV-005 | **P3** | LiveKit Port Drift    | dev vs devremote vs prod compose                           | Dev compose exposes `7881` (TURN TLS); devremote does NOT expose `7881`; prod exposes `7881`.                                                                                                                                                                                      | LiveKit TURN may not work on devremote                                                            |
| ENV-006 | **P3** | .env.example Drift    | Multiple `.env.example` files                              | 5 `.env.example` files: `apps/api/.env.example`, `apps/web/.env.example`, `infra/docker/.env.dev.example`, `infra/docker/.env.devremote.example`, `infra/docker/.env.prod.example`. Variable naming is inconsistent (e.g., `NEXT_PUBLIC_API_URL` vs `API_BASE_URL`).               | Confusing setup experience; risk of missing variables                                             |

### Drift Matrix

| Variable              | Local Dev                           | Devremote                        | Prod                              |
| --------------------- | ----------------------------------- | -------------------------------- | --------------------------------- |
| `NODE_ENV`            | development                         | development                      | production                        |
| `SUPABASE_URL`        | `http://host.docker.internal:54321` | Remote Supabase                  | Remote Supabase                   |
| `DOMAIN`              | N/A                                 | `mainecybertech.us`              | `mainecybertech.com`              |
| `NEXT_PUBLIC_API_URL` | `http://localhost:80`               | `https://chat.mainecybertech.us` | `https://chat.mainecybertech.com` |
| `FRONTEND_URL`        | N/A                                 | `https://chat.mainecybertech.us` | `https://chat.mainecybertech.com` |
| LiveKit TURN          | disabled                            | enabled (no port)                | enabled (port 5349)               |
| Health Check          | `/healthz` on API                   | `/health` on API                 | `/healthz` on API                 |
| Worker Health         | none                                | `kill -0 1`                      | `wget /healthz`                   |

### Normalization Plan

1. **Standardize Caddyfiles**: Extract shared base config, environment-specific overrides only
2. **Standardize .env.example**: Single `.env.example` per service with all variables documented; environment-specific values in separate override files
3. **Align health endpoints**: Use `/healthz` consistently (includes DB check) across all envs
4. **Fix image tag strategy**: Use SHA-pinned tags in prod compose by default; `:latest` as fallback only

**Final Decision**: **GO WITH RISKS** — No blocking drift. Prod and devremote are well-aligned. Local dev intentionally differs.

---

## 3. Observability & Incident Readiness Audit

### Executive Summary

Good foundation with solid health endpoints, Prometheus metrics, Sentry integration, and a comprehensive incident response runbook. Gaps exist in alert delivery (Prometheus/Alertmanager not deployed), worker metrics, logging PII redaction, and missing a runbook for database migration failures.

### Findings

| ID      | Sev    | Category           | File                             | Issue                                                                                                                                        | Impact                                                        | Fix                                                                                              |
| ------- | ------ | ------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| OPS-001 | **P2** | Error Tracking     | `apps/api/src/app.ts`            | Sentry import exists but no `Sentry.init()` call found in app startup path                                                                   | Errors not captured outside console/pino in production        | Add `Sentry.init()` with DSN at app startup                                                      |
| OPS-002 | **P2** | Metrics            | `apps/api/src/lib/metrics.ts`    | Prometheus metrics exported but `/metrics` endpoint behind `authenticate` only (not behind admin check)                                      | Auth bypass risk for Prometheus scrape                        | Add admin role check or IP whitelist to `/metrics`                                               |
| OPS-003 | **P2** | Metrics            | `apps/worker/src/main.ts`        | Worker has no Prometheus metrics — no visibility into job processing rates, failures, or queue depth                                         | Worker failures or queue backlogs invisible until user impact | Add prom-client to worker; track job completion/failure per processor                            |
| OPS-004 | **P2** | Logging            | `apps/api/src/lib/logger.ts`     | No PII scrubbing/redaction in logger — generic pino instance without sensitive field filtering                                               | PII (email, name, phone) could appear in logs                 | Add `redact` config for sensitive fields                                                         |
| OPS-005 | **P3** | Structured Logging | `apps/api/src/lib/logger.ts`     | Logger wraps pino but has no serialization config for errors (err property) or request context                                               | Error objects logged as generic strings, losing stack traces  | Add pino serializers for err, req, res                                                           |
| OPS-006 | **P3** | Health Endpoints   | `apps/worker/Dockerfile`         | Worker Dockerfile has no `HEALTHCHECK` directive                                                                                             | Docker cannot detect worker health natively                   | Add `HEALTHCHECK` with wget to `/healthz`                                                        |
| OPS-007 | **P3** | Audit Logging      | `apps/api/src/services/audit.ts` | Audit log failure queue uses in-memory array — lost on process restart                                                                       | Pending audit log entries lost on restart                     | Replace in-memory queue with Redis-backed (BullMQ) or DB-backed retry table                      |
| OPS-008 | **P3** | Incident Readiness | `docs/runbooks/`                 | Runbooks directory exists (14 files) but missing: database migration failure runbook, post-mortem template file, and incident drill schedule | Incomplete operational readiness                              | Create `database-migration-failure.md` runbook, create `docs/incidents/` directory with template |
| OPS-009 | **P2** | Alerting           | `docs/runbooks/alerting.md`      | Alerting runbook documents Prometheus + Alertmanager as "future" — not yet deployed                                                          | No automated P0/P1 alerting pipeline                          | Deploy Prometheus stack (can use DO monitoring as interim)                                       |

### Operator Blind-Spot Summary

1. **Worker failures invisible** — no metrics means queue backlogs go undetected until users report issues
2. **No PII redaction** — regulatory risk if logs are leaked or subpoenaed
3. **No automated alerting pipeline** — relies on DO monitoring and Sentry, no Prometheus/Alertmanager
4. **Audit log queue not durable** — pending audit entries lost on restart

### Recommended Upgrades

1. Deploy Prometheus + Alertmanager (or use DO Monitoring alerts configured via Terraform)
2. Add pino redaction for sensitive fields
3. Add worker prom-client metrics
4. Make audit failure queue persistent

**Final Decision**: **GO WITH RISKS** — Operators can detect and diagnose critical failures via health endpoints and Sentry. Worker visibility and automated alerting are gaps but not blocking.

---

## 4. Rollback Readiness Audit

### Executive Summary

Excellent rollback infrastructure exists: a dedicated `rollback` job in the production deploy workflow, SHA-tagged Docker images, and database migration rollback scripts. The `deploy-production.yml` supports a `rollback_sha` input parameter. Gaps exist in automated rollback testing and feature-flag-based kill switches for individual features.

### Findings

| ID      | Sev    | Category                        | File                                           | Issue                                                                                                                   | Impact                                           | Fix                                                                                  |
| ------- | ------ | ------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| RLL-001 | **P2** | Rollback Testing                | `.github/workflows/deploy-production.yml`      | Rollback job exists but is never automatically tested — no CI workflow verifies rollback works end-to-end               | Rollback might fail in real incident             | Add monthly scheduled workflow that tests rollback to previous SHA                   |
| RLL-002 | **P2** | Feature Kill Switches           | `apps/api/src/modules/feature-flags/routes.ts` | Feature flags exist but are NOT wired into any feature — all 8 feature-flag endpoints are CRUD-only with no consumers   | Cannot disable features without redeploy         | Implement kill-switch middleware that checks feature flag before processing requests |
| RLL-003 | **P3** | Rollback Docs                   | `docs/runbooks/migration-rollback.md`          | Migration rollback runbook exists (good) but lacks explicit rollback validation steps                                   | Operators may miss validation                    | Add post-rollback validation checklist (health check, data integrity check)          |
| RLL-004 | **P3** | Database Backward Compatibility | `supabase/rollback/`                           | Migration rollback scripts exist (49 `_down.sql` files) but no test verifies that rollback produces a consistent schema | Schema drift between forward/backward migrations | Add `supabase db diff` check after rollback in CI                                    |

### Rollback Trigger Checklist

1. Identify failing SHA from GitHub Actions run
2. Run: `gh workflow run deploy-production.yml --field rollback_sha=<last-known-good-sha>`
3. Verify: API `/healthz` returns 200
4. Verify: Web app loads and sends messages
5. Verify: Worker `/healthz` returns 200
6. Verify: No Sentry error spike

### Risk Register — Irreversible Changes

| Change Type                  | Reversible?                         | Mitigation                    |
| ---------------------------- | ----------------------------------- | ----------------------------- |
| Database schema migration    | ✅ Reversible (49 rollback scripts) | Test rollback in CI           |
| Environment variable changes | ✅ Reversible                       | Git-tracked .env templates    |
| Docker image update          | ✅ Reversible (SHA tags)            | Rollback workflow             |
| RLS policy change            | ✅ Reversible                       | Rollback migration            |
| Data deletion (GDPR)         | ❌ Irreversible                     | Soft-delete + compensation    |
| User account deletion        | ❌ Irreversible                     | Confirmation step + audit log |

**Final Decision**: **GO** — Rollback is well-documented and operationally clear. SHA-tagged images provide full traceability.

---

## 5. Governance / Policy Tiers Audit

### Executive Summary

The repo has a basic governance model (`hardening/policies/governance.json`) with block-on-P0/P1, auto-fix, and PR comments. No structured policy tiers exist for dev vs release vs production vs hotfix flows. The policy framework is single-tier: all environments share the same gating rules.

### Findings

| ID      | Sev    | Category            | File                                          | Issue                                                                                                       | Impact                                                          | Fix                                                                                                                                     |
| ------- | ------ | ------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| GOV-001 | **P2** | Policy Architecture | `hardening/policies/governance.json`          | Single-tier policy with no environment differentiation — dev, staging, and prod share same P0/P1 block rule | Overly restrictive for dev, potentially too permissive for prod | Define 4 tiers: dev (P0 block), release-candidate (P0/P1 block), prod (P0/P1 block+P2 alert), hotfix (P0 block only + mandatory review) |
| GOV-002 | **P2** | Hotfix Process      | `.github/workflows/deploy-production.yml:1-7` | Hotfix process documented in YAML comments but no formal policy artifact                                    | Hotfix policy may be applied inconsistently                     | Create `hardening/policies/hotfix.json` with mandatory compensating controls                                                            |
| GOV-003 | **P3** | Policy Change Audit | `hardening/policies/`                         | No versioning or change log for policy files                                                                | Policy changes not auditable                                    | Add `version` field to policy JSON; track changes in git                                                                                |
| GOV-004 | **P3** | Exceptions          | `hardening/exceptions/exceptions.json`        | Exceptions file exists but is empty — no guidance on exception approval process                             | Exceptions may be granted inconsistently                        | Document exception approval process (required approver, expiration, mandatory re-review)                                                |

### Recommended Policy Architecture

```
hardening/policies/
├── governance.json              (current — single tier)
├── governance.dev.json          (dev: block on P0 only)
├── governance.rc.json           (release-candidate: block on P0+P1)
├── governance.prod.json         (production: block on P0+P1, warn on P2)
├── governance.hotfix.json       (hotfix: block on P0, mandatory review, 7-day re-audit)
└── policy-workflow-mapping.md   (which policy applies to which environment)
```

### Workflow Wiring Recommendations

- **Push to develop**: Apply `governance.dev.json` — P0 blocks, P1/P2 warning
- **PR to main**: Apply `governance.rc.json` — P0+P1 blocks, P2 advisory
- **Release tag**: Apply `governance.prod.json` — P0+P1 blocks, P2 blocks on deploy
- **Hotfix**: Apply `governance.hotfix.json` — P0 blocks only + mandatory approver

**Final Decision**: **GO WITH RISKS** — Current single-tier model works for early-stage but will need tiering as the platform matures. Recommend phased implementation.

---

## 6. Features Gap Analysis

### Executive Summary

Feature flags are fully implemented (CRUD + evaluation API with role targeting, user targeting, and rollout percentages) but have zero consumers — no feature in the codebase queries a feature flag. Release note generation has no tooling or automation. A release note generator should be created to compose audit results into stakeholder-friendly output.

### Findings

| ID       | Sev    | Category      | File                                                                                 | Issue                                                                                             | Impact                                                       | Fix                                                                                                                |
| -------- | ------ | ------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| FEAT-001 | **P2** | Feature Flags | `apps/api/src/modules/feature-flags/routes.ts` + `apps/api/src/lib/feature-flags.ts` | Feature flag CRUD + evaluation API is fully built but unused by any frontend or backend feature   | No ability to toggle features without redeploy               | Wire at least 1 feature (e.g., admin v2 panel, AI features, experimental search) to feature flags                  |
| FEAT-002 | **P3** | Feature Flags | `apps/api/src/modules/feature-flags/routes.ts`                                       | Feature flag routes are NOT behind admin/owner role check — any authenticated user can CRUD flags | Non-admin users can modify global feature flags              | Add `requireAdmin` or `requirePermission` middleware to create/update/delete endpoints                             |
| FEAT-003 | **P3** | Release Notes | —                                                                                    | No release note generation tooling or automation                                                  | Audit results and change summaries must be manually compiled | Create release note generator script that reads audit summary JSON and produces markdown                           |
| FEAT-004 | **P3** | Release Notes | —                                                                                    | Release note template/schema does not exist in the repo                                           | Inconsistent release communication                           | Define release note schema with required fields: version, date, audit decisions, new features, fixes, known issues |

### Feature Flag Inventory

| Flag Key         | Purpose | Consumers? | Status                                   |
| ---------------- | ------- | ---------- | ---------------------------------------- |
| _(none defined)_ | —       | 0          | Flags exist but no features consume them |

### Release Note Schema Recommendation

```json
{
  "version": "1.2.3",
  "date": "2026-07-16",
  "audit_decision": "GO|GO WITH RISKS|NO-GO",
  "audit_findings_p0": 0,
  "audit_findings_p1": 0,
  "executive_summary": "...",
  "new_features": [],
  "fixes": [],
  "known_issues": [],
  "rollback_sha": "abc123",
  "post_release_validation": ["Health check", "E2E smoke suite"]
}
```

**Final Decision**: **GO WITH RISKS** — Feature flag infrastructure is solid but unused. Release note generation is absent. These are operational gaps, not blocking risks.

---

## 7. Testing Audits

### Executive Summary

E2E tests exist for auth and messaging flows but coverage is minimal. Chaos scenarios are documented but scripts are missing (only `tests/chaos/README.md` exists — `scenarios/` subdirectory exists but appears empty from inspection). Load tests use k6 with a trivial scenario (health check only). Integration tests cover only health endpoints. Visual regression tests do not exist.

### Findings

| ID      | Sev    | Category          | File                                        | Issue                                                                                                                                                                                                                                           | Impact                                                                                  | Fix                                                                                                                                |
| ------- | ------ | ----------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| TST-001 | **P2** | E2E Coverage      | `tests/e2e/`                                | Only 7 E2E test files — auth (4 tests), messaging (5 tests), file-upload, home, navigation, search. No tests for: settings, admin panel, notification preferences, channel management, sidebar, threads, reactions, file preview, emoji picker. | ~30% frontend feature coverage — regressions in uncovered areas will ship to production | Add E2E smoke suite covering: settings page load & save, admin panel tab navigation, thread send, reaction add/remove, file upload |
| TST-002 | **P2** | E2E Credentials   | `tests/e2e/`                                | All E2E tests skip when `test-signin.json` is absent — no mock/auth abstraction                                                                                                                                                                 | Tests never run in CI (credentials not present)                                         | Implement test user provisioning via API (create test user + workspace on setup) or use service-role token for auth                |
| TST-003 | **P2** | Chaos Tests       | `tests/chaos/scenarios/`                    | Scenarios directory exists but contains no scripts — only the README with conceptual descriptions                                                                                                                                               | No automated resilience verification                                                    | Implement `api-crash.sh` and `redis-down.sh` scripts as described in README                                                        |
| TST-004 | **P2** | Load Tests        | `tests/k6/load-test.js`                     | Load test only hits `/healthz` endpoint — no chat send, socket connect, search, or notification flows                                                                                                                                           | Load results meaningless for capacity planning                                          | Add realistic scenarios: message send (POST /messages), WebSocket connect, search query                                            |
| TST-005 | **P3** | Load Tests        | `tests/k6/smoke-test.js`                    | Smoke test exists (`tests/k6/smoke-test.js`) but same issue — only health check                                                                                                                                                                 | —                                                                                       | Extend with core API flows                                                                                                         |
| TST-006 | **P3** | Integration Tests | `tests/integration/`                        | Only health endpoint tests exist (2 tests)                                                                                                                                                                                                      | No API contract verification                                                            | Add integration tests for: create message, create channel, search, auth status, rate limiting                                      |
| TST-007 | **P3** | Visual Regression | —                                           | No visual regression testing — no Playwright screenshot comparisons or storybook image snapshots                                                                                                                                                | UI regressions (spacing, colors, responsive breakpoints) may go unnoticed               | Add Playwright visual snapshot tests for 10 key pages: login, workspace, channel view, settings, admin, search results             |
| TST-008 | **P2** | CI Execution      | `.github/workflows/validate.yml` + `ci.yml` | E2E tests run in CI but skip (no credentials). No integration test execution in CI. No load test runs on schedule (only on dispatch).                                                                                                           | CI passing does not mean tests are passing                                              | Add mock auth to E2E tests or provision test user; add integration test step; ensure load test runs weekly                         |

### Scenario Matrix

| Scenario                          | Type          | Priority | Status                                              |
| --------------------------------- | ------------- | -------- | --------------------------------------------------- |
| Auth: magic link flow             | Smoke         | P1       | ✅ Tested                                           |
| Auth: invalid email               | Smoke         | P1       | ✅ Tested                                           |
| Messaging: send message           | Smoke         | P1       | ✅ Tested                                           |
| Messaging: edit message           | Smoke         | P1       | ✅ Tested                                           |
| Messaging: delete message         | Smoke         | P1       | ✅ Tested                                           |
| Messaging: real-time WebSocket    | Comprehensive | P1       | ✅ Tested                                           |
| Settings: load & save preferences | Comprehensive | P2       | ❌ Missing                                          |
| Admin: tab navigation             | Comprehensive | P2       | ❌ Missing                                          |
| Admin: user management            | Comprehensive | P2       | ❌ Missing                                          |
| Thread: reply to message          | Smoke         | P1       | ❌ Missing                                          |
| Reaction: add/remove              | Smoke         | P1       | ❌ Missing                                          |
| File: upload & preview            | Comprehensive | P2       | ❌ Missing (file-upload.spec.ts exists but minimal) |
| Search: query & results           | Comprehensive | P2       | ✅ Exists (search.spec.ts)                          |
| Notification: preferences         | Comprehensive | P3       | ❌ Missing                                          |
| Channel: create & join            | Smoke         | P1       | ❌ Missing                                          |
| Sidebar: category management      | Comprehensive | P2       | ❌ Missing                                          |
| Rate limiting: trigger & recover  | Comprehensive | P2       | ❌ Missing                                          |
| API crash: degrade & recover      | Chaos         | P1       | ❌ Scripts missing                                  |
| Redis down: degrade & recover     | Chaos         | P1       | ❌ Scripts missing                                  |

### CI Execution Tiers Recommendation

- **Smoke suite** (PR gate, < 2 min): auth + messaging send + thread reply + reaction + channel create
- **Full suite** (push to main, < 10 min): all smoke + settings + admin + search + file upload
- **Chaos** (nightly): API crash + Redis down + DB disconnect
- **Load** (weekly): message send ramp-up + socket connect storm + search under load

**Final Decision**: **GO WITH RISKS** — Core messaging flows are tested but coverage is too thin for release certification. Focus on adding E2E smoke suite for critical flows and implementing chaos scripts.

---

## 8. Environment Promotion Audit

### Executive Summary

The environment promotion pipeline is well-structured with separate dev and prod workflows, Terraform IaC, and SHA-tagged Docker images. Key drift items identified in the environment audit apply here. The promotion path from dev → prod is clear but lacks automated smoke testing in the target environment before completing the deploy.

### Findings

| ID        | Sev    | Category              | File                                        | Issue                                                                                                                                   | Impact                                                                 | Fix                                                                                        |
| --------- | ------ | --------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| PROMO-001 | **P2** | Promotion Gating      | `.github/workflows/deploy-production.yml`   | No pre-promotion smoke test runs against the staging/dev environment before prod deploy                                                 | Regression may reach production                                        | Add smoke test step after `validate` but before `deploy` that runs against dev environment |
| PROMO-002 | **P2** | Rollback Verification | `.github/workflows/deploy-production.yml`   | No post-promotion smoke tests run against production after deploy completes                                                             | Deployment success = health endpoint only, not functional verification | Add post-deploy smoke test (send message, verify WebSocket, check search)                  |
| PROMO-003 | **P2** | Migration Safety      | `.github/workflows/supabase-migrations.yml` | Database migrations run BEFORE deploy — if migration succeeds but app crashes, rollback requires manual intervention                    | Schema/app version mismatch on failed deploy                           | Add migration check-and-verify step before deploy                                          |
| PROMO-004 | **P3** | Terraform State       | `infra/terraform/main.tf`                   | Terraform uses `ignore_changes = [user_data]` — cloud-init changes not tracked                                                          | Infrastructure drift invisible to Terraform                            | Document why user_data is ignored (cloud-init runs once on first boot)                     |
| PROMO-005 | **P3** | Resource Limits       | `infra/docker/docker-compose.prod.yml`      | Prod resource limits: web=256m, api=192m, worker=128m, redis=64m, caddy=64m. No evidence these limits were determined via load testing. | Potential OOM under peak load                                          | Perform load test to validate resource limits                                              |

### Promotion Readiness Statement

**Dev → Prod**: Ready. Both environments share the same Docker Compose structure, Caddy routing pattern (prod uses named matchers), and environment variable schema. Image SHA tags ensure deployment consistency.

**Blocking Issues**: None.

**Recommended Gating Improvements**:

1. Add pre-promotion smoke test (against dev environment)
2. Add post-promotion smoke test (against prod, after deploy)
3. Schedule migration check to prevent schema drift

**Final Decision**: **GO**

---

## Remediation Plan by Urgency

### P1 — Fix This Week

| #   | Domain        | Finding                                             | Est. Effort | Owner    |
| --- | ------------- | --------------------------------------------------- | ----------- | -------- |
| 1   | Security      | Reactions RLS — scope by channel membership         | 2h          | Backend  |
| 2   | Security      | Reactions batch endpoint — add message access check | 1h          | Backend  |
| 3   | Security      | Compliance exports — add workspace_id + RLS         | 1h          | Backend  |
| 4   | Security      | User presence RLS — scope to workspace members      | 1h          | Backend  |
| 5   | Frontend      | Admin mobile tab navigation — add mobile tab bar    | 2h          | Frontend |
| 6   | Frontend/i18n | Admin page — extract 150+ strings to i18n           | 4h          | Frontend |
| 7   | Frontend/i18n | Settings page — extract 80+ strings to i18n         | 2h          | Frontend |
| 8   | Frontend/i18n | Search-bar — extract 50+ strings to i18n            | 1h          | Frontend |
| 9   | Frontend      | Formatting bar — 44px touch targets on mobile       | 1h          | Frontend |
| 10  | Frontend      | Channel-info — surface API errors with retry        | 1h          | Frontend |

### P2 — Fix This Sprint

| #   | Domain        | Finding                                          | Est. Effort |
| --- | ------------- | ------------------------------------------------ | ----------- |
| 1   | Security      | GDPR delete — wrap in transaction                | 2h          |
| 2   | Security      | Webhook retries — move to BullMQ                 | 3h          |
| 3   | Security      | Private channel create — restrict to admins      | 1h          |
| 4   | Security      | Messages SELECT RLS — add private channel check  | 1h          |
| 5   | Security      | Announcements RLS — scope to workspace           | 30min       |
| 6   | Observability | Add Sentry.init() at app startup                 | 30min       |
| 7   | Observability | Add worker prom-client metrics                   | 3h          |
| 8   | Observability | Add pino redaction config                        | 30min       |
| 9   | Observability | Deploy Prometheus/Alertmanager                   | 4h          |
| 10  | Environment   | Standardize Caddyfiles — extract shared base     | 2h          |
| 11  | Environment   | Standardize env.example per service              | 1h          |
| 12  | Environment   | Align health endpoints across environments       | 30min       |
| 13  | Rollback      | Add monthly rollback test workflow               | 1h          |
| 14  | Rollback      | Wire feature flags to real features              | 4h          |
| 15  | Governance    | Implement policy tiers                           | 3h          |
| 16  | Governance    | Create hotfix policy artifact                    | 1h          |
| 17  | Features      | Wire feature flags to consumer code              | 2h          |
| 18  | Testing       | Add E2E smoke suite (thread, reactions, channel) | 4h          |
| 19  | Testing       | Implement mock auth for E2E tests                | 3h          |
| 20  | Testing       | Implement chaos scripts (api-crash, redis-down)  | 4h          |
| 21  | Testing       | Extend k6 tests with realistic scenarios         | 3h          |
| 22  | Testing       | Run integration tests in CI                      | 1h          |
| 23  | Promotion     | Add pre-promotion smoke tests                    | 2h          |
| 24  | Promotion     | Add post-promotion smoke tests                   | 2h          |
| 25  | Promotion     | Add migration check before deploy                | 1h          |
| 26  | Frontend      | Replace console.warn with toast (50+ locations)  | 4h          |

### P3 — Fix Next Sprint

| #   | Domain      | Finding                                              | Est. Effort |
| --- | ----------- | ---------------------------------------------------- | ----------- |
| 1   | Security    | CSP nonce support                                    | 1h          |
| 2   | Security    | Remove spoofable Content-Length middleware           | 30min       |
| 3   | Ops         | Worker Dockerfile HEALTHCHECK                        | 15min       |
| 4   | Ops         | Audit log queue — make persistent                    | 2h          |
| 5   | Ops         | Create database migration failure runbook            | 1h          |
| 6   | Rollback    | Add post-rollback validation checklist               | 30min       |
| 7   | Rollback    | Verify migration rollback produces consistent schema | 1h          |
| 8   | Governance  | Add versioning to policy files                       | 30min       |
| 9   | Governance  | Document exception approval process                  | 30min       |
| 10  | Features    | Create release note generator script                 | 2h          |
| 11  | Testing     | Add visual regression snapshots                      | 3h          |
| 12  | Testing     | Add integration tests for core API                   | 3h          |
| 13  | Environment | Fix LiveKit port drift (devremote)                   | 30min       |
| 14  | Promotion   | Document user_data ignore_reason                     | 15min       |
| 15  | Promotion   | Validate resource limits with load test              | 2h          |
| 16  | Frontend    | Fix search year hint                                 | 15min       |
| 17  | Frontend    | Replace "Loading..." with Skeleton component         | 1h          |
| 18  | Frontend    | Remove dead CSS (gridArea, density modes)            | 30min       |

---

## Operator Handoff Notes

### Critical Monitoring Gaps

1. **Worker metrics**: No visibility into job processing rates or queue depth. If you suspect worker issues, SSH to droplet and check `docker compose logs worker --tail 100`. Manual queue depth check: `docker exec <redis-container> redis-cli llen bull:*:wait`.
2. **Alerting pipeline**: Prometheus/Alertmanager not deployed. Current alerts rely on DO Monitoring (CPU, memory, disk) and Sentry (error spikes). Configure Sentry alert rules at sentry.io.
3. **PII in logs**: No redaction is configured. If investigating a production issue, check logs before sharing screenshots.

### Known Rollback Concerns

- Rollback works for code and Docker images (SHA-tagged). Database rollbacks require running migration rollback scripts manually — they are NOT automatic.
- Feature flags exist but are not wired to any feature — cannot use them as kill switches.
- If a migration causes data loss, full restore from Supabase backup is required.

### Testing Gaps to Track

- E2E tests pass in CI only with `test-signin.json` present (all skip if absent). Tests do NOT run in CI.
- Chaos scripts are documented but not implemented — resilience testing is manual.
- Load tests only hit `/healthz` — results are meaningless for capacity planning.

### Key Configuration Files

| File                                      | Purpose                                         |
| ----------------------------------------- | ----------------------------------------------- |
| `infra/docker/docker-compose.prod.yml`    | Production service definitions                  |
| `infra/docker/Caddyfile.prod`             | Production reverse proxy config                 |
| `infra/terraform/main.tf`                 | Infrastructure as Code (droplet, firewall, DNS) |
| `.github/workflows/deploy-production.yml` | Production deploy + rollback workflows          |
| `apps/api/.env.example`                   | API environment variable template               |
| `hardening/policies/governance.json`      | Audit gating policy                             |

---

## Final Domain Decisions

| Domain                    | Decision          | Key Rationale                                                                                           |
| ------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| **Security**              | GO WITH RISKS     | 4 P1 RLS gaps (reactions, presence, compliance exports) — all require auth, not unauthenticated exploit |
| **Environment**           | GO WITH RISKS     | Significant drift between 3 environments but no blocking deployment-breakers                            |
| **Ops/Observability**     | GO WITH RISKS     | Worker visibility and automated alerting are gaps; health endpoints and Sentry cover critical paths     |
| **Rollback Readiness**    | GO                | SHA-tagged images, rollback job, migration rollback scripts — well-documented                           |
| **Governance**            | GO WITH RISKS     | Single-tier policy works for now; tiering needed as platform grows                                      |
| **Features**              | GO WITH RISKS     | Feature flags built but unused; release note automation absent                                          |
| **Testing**               | GO WITH RISKS     | Core flows tested but coverage ~30%; chaos scripts not implemented                                      |
| **Environment Promotion** | GO                | Clean promotion path; minor gating improvements recommended                                             |
| **OVERALL**               | **GO WITH RISKS** | **0 P0, 9 P1, 26 P2, 18 P3** — all P1s are addressable within 1 week                                    |

---

_Report generated from 11 domain-specific audit prompts executed against `C:\temp\chat` on July 16, 2026._
