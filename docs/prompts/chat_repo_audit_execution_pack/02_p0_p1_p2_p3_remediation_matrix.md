# P0 / P1 / P2 / P3 Remediation Matrix

This matrix is intended to be used directly as an execution backlog. Items are mapped to specific files, folders, and workflows where possible.

## Severity definitions

- **P0** — critical risk; should be addressed before high-confidence production use
- **P1** — major production-readiness risk; should be handled soon after P0 or in the same release train
- **P2** — meaningful quality / maintainability / onboarding improvement
- **P3** — lower-urgency optimization / refinement / strategic improvement

---

## P0 Remediation Items

### P0-001 — Replace shared mutable backend Supabase auth/session pattern

- **Issue:** `authenticate.ts` validates bearer tokens and then calls `supabase.auth.setSession(...)` on a shared client.
- **Why it matters:** creates a correctness and security risk in concurrent request handling.
- **Primary files:**
  - `apps/api/src/middleware/authenticate.ts`
  - `apps/api/src/lib/supabase.ts`
  - auth-dependent services that currently assume shared session context
- **Primary workflows to verify after change:**
  - `.github/workflows/validate.yml`
  - `.github/workflows/ci.yml`
  - `.github/workflows/deploy-development.yml`
  - `.github/workflows/deploy-production.yml`
- **Recommended implementation direction:**
  - stop mutating a shared singleton auth session per request
  - introduce request-scoped auth context or request-specific Supabase client token usage
  - ensure downstream services can access user context without shared mutable session state
- **Validation steps:**
  - auth unit tests
  - integration test for multiple concurrent authenticated requests
  - manual login → workspace → channel → message flow validation
- **Execution owner:** backend / platform engineer
- **Effort:** medium

### P0-002 — Add explicit authorization barriers for sensitive operations

- **Issue:** visible route code does not consistently show ownership / membership / role checks for read/update/delete operations.
- **Why it matters:** relying only on implicit DB behavior/RLS is insufficiently visible and hard to audit.
- **Primary files/modules:**
  - `apps/api/src/modules/workspaces/routes.ts`
  - `apps/api/src/modules/workspaces/service.ts`
  - `apps/api/src/modules/channels/routes.ts`
  - `apps/api/src/modules/channels/service.ts`
  - `apps/api/src/modules/messages/routes.ts`
  - `apps/api/src/modules/messages/service.ts`
  - `apps/api/src/modules/webhooks/routes.ts`
  - `apps/api/src/modules/webhooks/service.ts`
  - `apps/api/src/lib/membership.ts`
  - DB policy files under `packages/db/sql/policies` and relevant `supabase/migrations`
- **Primary workflows to verify after change:**
  - `.github/workflows/validate.yml`
  - `.github/workflows/audit-pr-gate.yml`
  - `.github/workflows/environment-promotion-audit.yml`
- **Recommended implementation direction:**
  - add explicit authorization helper/service
  - verify workspace membership and, where necessary, ownership/admin role before reads/updates/deletes
  - align application-level checks with DB/RLS policy definitions
- **Validation steps:**
  - negative-path integration tests (non-member, wrong-workspace, wrong-owner)
  - webhook access control tests
  - message/channel deletion authorization tests
- **Execution owner:** backend / security engineer
- **Effort:** large

---

## P1 Remediation Items

### P1-001 — Reduce deployment blast radius and destructive cleanup behaviors

- **Issue:** deployment and infra workflows aggressively delete/prune resources and cleanup containers/images/networks.
- **Primary workflows/files:**
  - `.github/workflows/deploy-development.yml`
  - `.github/workflows/deploy-production.yml`
  - `.github/workflows/infra-development.yml`
  - `infra/docker/docker-compose.devremote.yml`
  - `infra/docker/docker-compose.prod.yml`
  - `infra/docker/Caddyfile`
  - `infra/terraform/*`
- **Recommended implementation direction:**
  - narrow cleanup scope to app-owned resources only
  - avoid broad `docker system prune -af --volumes` style cleanup without stronger safeguards
  - add preflight checks and rollback-safe deployment stages
  - document explicit rollback paths near the runtime workflows themselves
- **Validation steps:**
  - dry-run deployment to development
  - verify no unrelated resources are removed
  - verify rollback runbook against real workflow behavior
- **Execution owner:** DevOps / platform engineer
- **Effort:** medium/large

### P1-002 — Harden webhook security model

- **Issue:** webhook URLs are HTTPS-only, but visible controls do not show stronger SSRF/egress/signing hardening.
- **Primary files:**
  - `apps/api/src/modules/webhooks/routes.ts`
  - `apps/api/src/modules/webhooks/service.ts`
  - docs under `docs/audits`, `docs/runbooks`, and security guidance docs
- **Recommended implementation direction:**
  - add HMAC-style signature generation/validation standard
  - add outbound destination restrictions / SSRF guardrails
  - add retry/failure alerting standards
  - define secret handling policy for webhooks
- **Validation steps:**
  - test successful delivery
  - test invalid endpoint rejection
  - test delivery logging and failure handling
- **Execution owner:** backend / security engineer
- **Effort:** medium

### P1-003 — Harden upload security controls

- **Issue:** signed uploads exist, but size/type/content-policy controls are not clearly visible in the provided source.
- **Primary files:**
  - `apps/api/src/modules/messages/routes.ts`
  - `apps/api/src/modules/auth/routes.ts`
  - object-storage policy/config locations if applicable
- **Recommended implementation direction:**
  - file-size limits
  - content-type allowlists
  - high-risk file handling policy
  - document upload security expectations
- **Validation steps:**
  - oversized upload rejection
  - invalid content type rejection
  - valid image/document upload regression test
- **Execution owner:** backend engineer
- **Effort:** medium

### P1-004 — Complete the remaining UX/accessibility/feedback hardening items

- **Issue:** previous reconciliation identified a staged set of UX/accessibility/feedback fixes; visible source shows some progress but manual verification is still needed.
- **Primary files:**
  - `packages/ui/src/components/dialog.tsx`
  - `apps/web/app/layout.tsx`
  - `apps/web/app/(workspace)/layout.tsx`
  - `apps/web/components/chat/chat-view.tsx`
  - `apps/web/components/chat/message-list.tsx`
  - `apps/web/components/chat/message-input.tsx`
  - `apps/web/components/workspace/create-workspace-dialog.tsx`
  - `apps/web/components/channel/create-channel-dialog.tsx`
- **Recommended implementation direction:**
  - finalize focus trap / close affordance in dialog
  - verify skip-to-content and keyboard accessibility
  - add/verify shared error boundary behavior
  - add toast notifications for important create/save actions
  - verify mobile sidebar and thread behavior at common breakpoints
  - normalize loading/empty/error feedback states
- **Validation steps:**
  - keyboard-only pass
  - screen-reader smoke test
  - mobile breakpoint manual QA
  - create workspace/channel/message feedback QA
- **Execution owner:** frontend engineer / UX engineer
- **Effort:** medium

### P1-005 — Expand integration and E2E coverage for core flows

- **Issue:** visible tests exist, but deeper coverage of authz, realtime, uploads, and security-sensitive flows is still needed.
- **Primary files/folders:**
  - `tests/e2e/*`
  - `tests/integration/*`
  - API module test folders under `apps/api/src/modules/**/__tests__`
  - `.github/workflows/validate.yml`
- **Recommended implementation direction:**
  - add workspace/channel/message end-to-end flows
  - add authz negative-path tests
  - add upload-path tests
  - add webhook-path tests
  - add notification and push-subscription regression coverage
- **Validation steps:**
  - CI E2E pass
  - local end-to-end pass against dev stack
- **Execution owner:** QA / backend / frontend engineer
- **Effort:** large

### P1-006 — Environment-gate or remove local test-account shortcuts from non-dev builds

- **Issue:** login UI exposes local test-user quick-fill buttons; not appropriate for non-development environments unless tightly guarded.
- **Primary files:**
  - `apps/web/components/auth/login-form.tsx`
  - `apps/web/lib/env.ts`
  - any build/runtime env configuration files
- **Recommended implementation direction:**
  - hide test-account helpers behind explicit development-only checks
  - ensure they are not rendered in production bundles
- **Validation steps:**
  - development shows test helpers only when expected
  - production build does not render them
- **Execution owner:** frontend engineer
- **Effort:** small

---

## P2 Remediation Items

### P2-001 — Refactor route validation / typed response helpers

- **Primary files:** API route modules and validation helpers
- **Goal:** reduce repetition and standardize API error responses
- **Impacted areas:** `apps/api/src/modules/*/routes.ts`, `apps/api/src/config/validators.ts`
- **Effort:** medium

### P2-002 — Improve frontend route/data-loading efficiency

- **Primary files:**
  - `apps/web/app/(auth)/login/page.tsx`
  - `apps/web/app/page.tsx`
  - `apps/web/app/(workspace)/[workspaceSlug]/page.tsx`
  - `apps/web/app/(workspace)/[workspaceSlug]/[channelId]/page.tsx`
  - `apps/web/app/(workspace)/layout.tsx`
  - chat/breadcrumb/search components
- **Goal:** reduce repeated “fetch all then derive one” patterns
- **Effort:** medium

### P2-003 — Complete settings/notification-preferences UX

- **Primary files:**
  - `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`
  - `apps/api/src/modules/preferences/routes.ts`
  - `apps/api/src/modules/preferences/service.ts`
- **Goal:** move notification preference UX from placeholder toward usable product functionality
- **Effort:** medium

### P2-004 — Strengthen runtime observability

- **Primary areas:**
  - app instrumentation
  - Sentry setup/usage
  - audit dashboard scripts/docs
  - release and incident runbooks
- **Goal:** add stronger metrics/alerts for deploy health, webhook failures, notification failures, socket health, and error trends
- **Effort:** medium

### P2-005 — Publish canonical engineering source-of-truth docs

- **Primary files/folders:**
  - `README.md`
  - `docs/architecture/*`
  - `docs/contributing/*`
  - `docs/runbooks/*`
- **Goal:** create compact architecture/authz/API/data-model/navigation guidance
- **Effort:** medium

### P2-006 — Standardize config package / env examples / config inheritance

- **Reconciliation-linked item:** prior reconciliation explicitly called out shared config package and complete `.env.example` coverage.
- **Primary files/folders:**
  - `apps/api/.env.example`
  - `apps/web/.env.example`
  - root config files (`tsconfig.base.json`, `eslint.config.mjs`)
  - any future `packages/config/*` standardization area if introduced
- **Goal:** reduce config drift and improve onboarding/dev consistency
- **Effort:** medium

### P2-007 — Rationalize repo navigation for operators vs contributors

- **Primary areas:** docs/readme/contributing
- **Goal:** clearly separate generated governance artifacts from canonical code/docs
- **Effort:** small

---

## P3 Remediation Items

### P3-001 — Optimize reaction fetching strategy

- **Primary file:** `apps/web/components/chat/message-list.tsx`
- **Goal:** avoid per-message N-style fetch patterns for reactions in large channels
- **Effort:** medium

### P3-002 — Revisit presence model for future scale

- **Primary file:** `apps/api/src/lib/socket.ts`
- **Goal:** move beyond local in-memory presence model if scaling horizontally
- **Effort:** medium/large

### P3-003 — Rationalize long-term process artifact sprawl

- **Primary areas:** `docs/`, `scripts/`, governance bundles
- **Goal:** define what remains canonical, generated, archived, or operator-only
- **Effort:** medium

### P3-004 — Explore richer RBAC / tenant-governance model

- **Primary areas:** authz layer, DB policy docs, product admin surfaces
- **Goal:** support more complex tenancy/administration if product scope expands
- **Effort:** large

---

## Recommended sequencing

### Wave 1

- P0-001
- P0-002

### Wave 2

- P1-001
- P1-002
- P1-003
- P1-006

### Wave 3

- P1-004
- P1-005

### Wave 4

- P2 cluster (config/docs/onboarding/observability/settings/frontend efficiency)

### Wave 5

- P3 optimization and strategic improvements
