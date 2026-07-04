# Reconciliation Report

- Prompt: **recon_preflight_master**
- Domain: **audit**
- Run ID: **recon_preflight_master_20260703_063138**
- Generated: **2026-07-03T07:05:00Z**
- Decision: **NO-GO**
- P0: **1**, P1: **3**
- P2: **4**, P3: **1**
- Readiness: **0.00**

## Findings

### P0 — Reconciliation inventory shows API has 10 modules (auth, channels, consent, feature-flags, messages, notifications, push, reactions, webhooks, workspaces) but worker has 4 stub processors (webhook-delivery, notification, search-indexer, cleanup) that return mock responses — the worker service exists but does nothing

- **File:** `apps/api/src/modules/`
- **Category:** Structural Drift
- **Impact:** Worker deployment is cosmetic. Webhook delivery, notification processing, search indexing, cleanup are all no-ops. Any reconciliation that assumes background processing is based on a non-functional premise.
- **Fix:** Either implement actual worker processor logic or remove the worker and handle background tasks in-process

### P1 — 19 workflows exist but only 8 use Corepack-based pnpm setup — the remaining 11 workflows use stale patterns (pnpm/action-setup@v4) or are on workflow_dispatch-only with no branch triggers

- **File:** `.github/workflows/`
- **Category:** CI/CD
- **Impact:** Inconsistent CI/CD patterns across workflows. Some workflows may silently use wrong Node/pnpm versions.
- **Fix:** Standardize all 19 workflows to use Corepack-based pnpm enablement pattern (enable-corepack → setup-node --corepack-enabled → pnpm install)

### P1 — Dev compose uses Caddyfile (no env vars), prod compose uses Caddyfile.prod (domains from .env) — but devremote also uses Caddyfile with no domain override path for local development

- **File:** `infra/docker/`
- **Category:** Infra
- **Impact:** Local dev on devremote compose uses production domains from Caddyfile. Developers testing on localhost will hit production DNS or get TLS errors.
- **Fix:** Add Caddyfile.dev for local development with localhost domains, or add conditional domain logic in Caddyfile

### P1 — 6 docs/architecture/\*.md files reference old Traefik-based routing or Debian-based setup — current infra uses Caddy + Ubuntu. Docs lag actual infra by 1-2 iterations.

- **File:** `docs/`
- **Category:** Docs
- **Impact:** Anyone reading docs to understand architecture gets a misleading mental model. Reconciliation that trusts docs over code will propagate errors.
- **Fix:** Update all architecture docs to reflect current Caddy + Ubuntu stack before running reconciliation

### P2 — 24 migrations exist but 2 are duplicate pairs (add_missing_indexes ×2, enforce_data_retention ×2) — unclear which is canonical

- **File:** `supabase/migrations/`
- **Category:** Supabase
- **Impact:** New DB setups applying all 24 migrations will create duplicate indexes and policies. Schema drift between environments.
- **Fix:** Remove superseded migration files. Document which migrations are canonical.

### P2 — scripts/ contains both setup-dev.ps1 and setup-dev.sh but only setup-dev.ps1 is correct (uses supabase/migrations/_.sql). setup-dev.sh references nonexistent packages/db/sql/migrations/_.sql path.

- **File:** `scripts/`
- **Category:** Scripts
- **Impact:** macOS/Linux developers hitting setup-dev.sh will get broken migrations on first run.
- **Fix:** Fix setup-dev.sh migration path to match setup-dev.ps1, or deprecate it with a shim that calls the PowerShell version

### P2 — packages/db/src/types.ts has 7 types (WebhookEndpoint, PushSubscription, UserPreference, ConsentLog, AuditLog, ThreadParticipant, ChannelRoleOverride) that were added recently but packages/ui/ has no corresponding type exports — UI components that reference these types must import from db directly

- **File:** `packages/`
- **Category:** Shared Packages
- **Impact:** Coupling between packages is undocumented. UI team must know to import types from db package. No barrel export in ui package re-exports these.
- **Fix:** Add re-exports in packages/ui/src/index.ts for all shared types from packages/db

### P2 — Only 1 service test exists (workspace.service.test.ts) across all 10 API modules. E2E test file (auth-workspace-chat.spec.ts) exists but may not run in CI without playwright browsers installed.

- **File:** `tests/`
- **Category:** Testing
- **Impact:** Test coverage is ~5% of the API surface. Reconciliation changes cannot be validated by automated tests.
- **Fix:** Add at minimum smoke tests for each module before reconciliation. Cache playwright browsers in CI.

### P3 — Husky pre-commit exists but runs only prettier — no eslint, no typecheck, no test run. Lint-staged config references only prettier.

- **File:** `.husky/pre-commit`
- **Category:** Tooling
- **Impact:** Formatting errors caught before commit, but type errors and lint violations pass through to CI, wasting pipeline time.
- **Fix:** Add eslint --fix and tsc --noEmit to the lint-staged pipeline in pre-commit hook
