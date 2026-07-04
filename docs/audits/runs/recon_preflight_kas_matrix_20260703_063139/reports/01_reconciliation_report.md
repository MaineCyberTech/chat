# Reconciliation Report

- Prompt: **recon_preflight_kas_matrix**
- Domain: **audit**
- Run ID: **recon_preflight_kas_matrix_20260703_063139**
- Generated: **2026-07-03T07:15:00Z**
- Decision: **NO-GO**
- P0: **1**, P1: **2**
- P2: **3**, P3: **1**
- Readiness: **0.00**

## Findings

### P0 — Keep/Adapt/Skip: Frontend shell layout — KEEP current. The workspace layout with sidebar+header+main area is functional, responsive (md breakpoint auto-collapse), and includes error/loading boundaries. Any rewrite risks losing the responsive sidebar behavior that was hard-won in Round 3 UX fixes.

- **File:** `apps/web/app/(workspace)/layout.tsx`
- **Category:** Frontend Shell
- **Impact:** Significant regression risk with low upside. Layout is in good state after UX rounds.
- **Fix:** No changes to frontend layout shell during reconciliation. Mark as KEEP.

### P1 — Keep/Adapt/Skip: CI/CD workflows — ADAPT with standardization. 19 workflows exist with 3 different pnpm setup patterns. Corepack pattern is the target but only 8 workflows use it.

- **File:** `.github/workflows/`
- **Category:** CI/CD
- **Impact:** Inconsistent CI patterns cause silent failures (wrong pnpm version, stale cache). Standardization reduces CI flake.
- **Fix:** Standardize all 19 workflows to Corepack-based pnpm setup. Keep workflow triggers/destinations unchanged.

### P1 — Keep/Adapt/Skip: Testing strategy — ADAPT. Current state has 1 service test for 10 modules. Minimal target is smoke tests for each module before reconciliation.

- **File:** `apps/api/src/modules/`
- **Category:** Testing
- **Impact:** Cannot validate reconciliation changes without test coverage. Regressions will go undetected.
- **Fix:** Add smoke tests for auth, channels, messages, reactions, webhooks, notifications, consent modules. Keep existing workspace test structure.

### P2 — Keep/Adapt/Skip: Database migrations — SKIP structural changes. Duplicate migration files exist but reconciliation must NOT modify, rename, or remove existing migrations.

- **File:** `supabase/migrations/`
- **Category:** Supabase
- **Impact:** Changes to applied migrations break Supabase CLI migration tracking. Production database integrity at risk.
- **Fix:** Mark migration deduplication as 'defer - separate infra task'. Only ADD new migrations during reconciliation.

### P2 — Keep/Adapt/Skip: Shared packages structure — ADAPT. packages/db/types.ts has 7 new types not re-exported through packages/ui. Clean up barrel exports.

- **File:** `packages/`
- **Category:** Shared Packages
- **Impact:** UI components import from db package directly, creating undocumented cross-package coupling.
- **Fix:** Add re-exports for all shared types to packages/ui/src/index.ts. Keep package directory structure unchanged.

### P2 — Keep/Adapt/Skip: Documentation — SKIP structural changes. Architecture docs lag behind current infra but reconciliation should not attempt a full doc rewrite.

- **File:** `docs/`
- **Category:** Docs
- **Impact:** Doc updates are high-effort and low-risk to defer. Reconciliation should focus on code/infra changes.
- **Fix:** Add a single note to AGENTS.md documenting known doc drift. Defer full doc refresh to a separate docs-only pass.

### P3 — Keep/Adapt/Skip: Auth flows — KEEP current with tiny additions. Auth module works (magic link, session, RLS). Only missing: rate limiting on auth routes.

- **File:** `apps/api/src/modules/auth/`
- **Category:** Auth
- **Impact:** Auth is critical path. Minimal changes only.
- **Fix:** Apply rate-limit middleware to auth routes. No structural or contract changes to auth flow.
