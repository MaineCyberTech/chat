# Execution Plan

This document converts the audit findings into a directly executable sequence.

## Guiding rules

1. Do not optimize cosmetic issues before security and auth correctness are addressed.
2. Treat authorization and deployment blast-radius work as production gates.
3. Keep changes scoped by wave and verify each wave before starting the next.
4. Use explicit validation gates after every wave.
5. Preserve existing working auth/chat/workspace/channel/message flows during remediation.

---

## Wave 0 — Preparation

### Objectives

- establish canonical working branch
- collect baseline evidence
- freeze direct production changes until P0 items are planned

### Actions

- create a remediation branch
- record current CI status
- capture manual smoke test results for:
  - login
  - workspace load
  - channel navigation
  - message send/edit/delete
  - upload
  - reactions
  - notifications list
- verify truncation/unknown areas that still need direct source inspection

### Deliverables

- baseline smoke-test notes
- baseline CI status snapshot
- baseline deployment runbook acknowledgement

---

## Wave 1 — P0 Security/Correctness Gate

### Scope

- replace shared-session auth pattern
- add explicit authorization barriers

### Work packages

#### WP-1 — Request-scoped auth context

- refactor backend auth middleware and Supabase usage patterns
- update downstream auth-dependent services
- add concurrency-safe auth tests

#### WP-2 — Authorization enforcement map

- define authorization rules for:
  - workspaces
  - channels
  - messages
  - webhooks
  - upload paths
- implement authorization helpers/service
- align app-level checks with DB policy behavior

### Exit criteria

- auth and authorization integration tests pass
- CI validate passes
- manual smoke test for all core user flows passes
- code review confirms no shared mutable auth/session pattern remains

---

## Wave 2 — P1 Operational Hardening Gate

### Scope

- reduce deployment blast radius
- harden webhooks and uploads
- remove/gate non-prod login helpers

### Work packages

#### WP-3 — Safer deployments

- reduce destructive cleanup operations
- add rollout guardrails
- verify rollback behavior against real workflows

#### WP-4 — Webhook hardening

- add stronger signature model
- add SSRF/egress guardrails
- improve failure alerting/visibility

#### WP-5 — Upload hardening

- enforce size/type/allowlist rules
- document content-policy behavior

#### WP-6 — Dev-only auth helpers

- ensure local test login helpers are dev-only

### Exit criteria

- development deploy succeeds without destructive side effects
- webhook/upload tests pass
- production build does not expose local test helpers

---

## Wave 3 — P1 Product-Readiness Gate

### Scope

- finish UX/accessibility/feedback work
- expand E2E coverage

### Work packages

#### WP-7 — UX/accessibility completion

- dialog focus management
- skip-to-content verification
- error boundary verification
- consistent toasts/feedback on key actions
- mobile sidebar/thread validation
- normalize loading/empty/error states

#### WP-8 — E2E/integration expansion

- workspace create/select flow
- channel create/navigate flow
- message send/edit/delete flow
- upload flow
- unauthorized access negative path
- webhook and notification flows where feasible

### Exit criteria

- keyboard and breakpoint QA complete
- E2E suite passes in CI
- user-facing flows have consistent feedback and fail gracefully

---

## Wave 4 — P2 Quality/Onboarding/Operability Improvements

### Scope

- config standardization
- settings completion
- docs improvement
- frontend loading/performance cleanup
- observability strengthening

### Work packages

#### WP-9 — Config/env standardization

- complete `.env.example` coverage
- rationalize config inheritance/shared config package approach if still needed

#### WP-10 — Settings/preferences completion

- turn notification preference placeholder into usable functionality

#### WP-11 — Canonical documentation

- architecture source-of-truth
- authz model
- contributor start-here guide

#### WP-12 — Frontend efficiency cleanup

- reduce repeated bootstrap fetches
- improve component data-loading boundaries

#### WP-13 — Observability strengthening

- define key runtime signals and alert paths

### Exit criteria

- onboarding path is clear
- contributor docs are coherent
- settings UX no longer contains obvious placeholders for core preference behavior
- observability backlog is either implemented or explicitly planned

---

## Wave 5 — P3 Optimization / Strategic Follow-on

### Scope

- reaction/presence optimization
- governance artifact rationalization
- future RBAC / scale planning

### Exit criteria

- no urgent production blockers remain
- optimization efforts are measured and justified

---

## Validation gates by wave

### Common CI gates

- `test`
- `lint`
- `typecheck`
- `build`
- `e2e`

### Manual QA gates

- login
- workspace routing
- channel routing
- message send/edit/delete
- upload
- reactions
- notifications list/states
- settings save
- mobile responsiveness critical breakpoints

### Deployment gates

- development deploy dry-run/safe-run
- rollback verification
- health endpoint verification
- environment configuration sanity checks

---

## Ownership model suggestion

- **Backend/security lead:** Wave 1, webhook/upload hardening
- **Platform/DevOps lead:** deployment blast-radius reduction and rollback validation
- **Frontend/UX lead:** Wave 3 and settings/frontend quality work
- **QA/release owner:** E2E expansion, regression matrix, wave exit signoff
- **Documentation/handoff owner:** canonical source-of-truth docs and contributor path

---

## Release recommendation

Do **not** bundle all remediation work into one uncontrolled release.

Recommended release pattern:

1. release Wave 1 after backend auth/authz hardening is validated
2. release Wave 2 after deployment and security surfaces are hardened
3. release Wave 3 after UX/accessibility/E2E completion
4. batch Wave 4 and beyond opportunistically once production confidence is higher
