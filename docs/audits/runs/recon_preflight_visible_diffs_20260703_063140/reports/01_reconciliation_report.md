# Reconciliation Report

- Prompt: **recon_preflight_visible_diffs**
- Domain: **audit**
- Run ID: **recon_preflight_visible_diffs_20260703_063140**
- Generated: **2026-07-03T07:20:00Z**
- Decision: **NO-GO**
- P0: **0**, P1: **2**
- P2: **4**, P3: **2**
- Readiness: **0.00**

## Findings

### P1 — Visible diff: develop snapshot uses Corepack-based pnpm, main uses pnpm/action-setup@v4. Current repo has mixed patterns (8 Corepack, 11 legacy). Standardization is needed before reconciliation proceeds.

- **File:** `.github/workflows/`
- **Category:** Workflow Style Diff
- **Impact:** Inconsistent pnpm setup across workflows means some CI runs use different pnpm versions. Version-dependent behavior differences in CI.
- **Fix:** Standardize all 19 workflows to Corepack pattern. Remove pnpm/action-setup usage entirely.

### P1 — Visible diff: develop snapshot creates tfvars from secrets and includes stale-lock cleanup. Current infra-development.yml uses terraform apply -auto-approve -var-file pattern but does NOT have stale-lock cleanup logic.

- **File:** `.github/workflows/infra-development.yml`
- **Category:** Terraform Workflow Diff
- **Impact:** Terraform apply can fail on stale lock files, requiring manual intervention. Only affects infra provisioning, not deploys.
- **Fix:** Add stale-lock cleanup step before terraform apply in infra-development.yml

### P2 — Visible diff: develop snapshot has additional migrations (5302034_ticket_comment_editing.sql, 5302035_bootstrap_portal_access.sql) not present in current repo. These may be portal-specific and not applicable to the chat monorepo.

- **File:** `supabase/migrations/`
- **Category:** Supabase Migration Drift
- **Impact:** Missing migrations may affect cross-repo compatibility if portal and chat share a database. If migrations are portal-specific, they should not be adopted.
- **Fix:** Review migration content. If portal-specific, mark as SKIP. If shared schema changes, adopt with careful migration ordering review.

### P2 — Visible diff: develop uses .mjs for ESLint/Jest configs, current repo uses .js. This is a cosmetic naming difference with no functional impact — both work with modern Node.

- **File:** `packages/`
- **Category:** Config File Naming Diff
- **Impact:** Cosmetic only. Changing config file extensions during reconciliation would create unnecessary git churn and potentially break IDE integrations.
- **Fix:** Mark as SKIP. Config file extension preferences are not worth reconciliation churn.

### P2 — Visible diff: develop has instrumentation.ts + Sentry config, current repo has SentryErrorBoundary.tsx + FileDropzone.tsx. Component naming and structure differ between snapshots.

- **File:** `apps/web/components/`
- **Category:** Web App Component Diff
- **Impact:** Adopting Sentry instrumentation from develop would conflict with existing SentryErrorBoundary. Need to reconcile Sentry strategy before merging components.
- **Fix:** Compare Sentry approaches. If instrumentation.ts replaces error boundary approach, adopt instrumentation. If complementary, merge both.

### P2 — Visible diff: develop references Vercel project-specific flags (--project mainecybertech-portal-dev), current repo has no Vercel config at all (no vercel.json). The chat app may not use Vercel.

- **File:** `apps/web/`
- **Category:** Vercel Deployment Diff
- **Impact:** Vercel differs are irrelevant to this repo which deploys via Docker + Caddy + DigitalOcean. No action needed.
- **Fix:** Mark as SKIP. Vercel deployment diff is relevant to the portal repo, not the chat monorepo.

### P3 — Visible diff: develop has dependabot.yml and husky/pre-commit, current repo has both already (added during hardening). This diff is RESOLVED — no gap exists.

- **File:** `.github/`
- **Category:** Policy Files Diff
- **Impact:** No action needed. Current repo already has these policy files.
- **Fix:** Mark as RESOLVED. Current repo is aligned with develop on dependabot + husky presence.

### P3 — Visible diff: develop has docs/portal_platform_formal_handoff_bundle/ not in current repo. This is a portal-specific docs bundle that should not be merged into the chat monorepo.

- **File:** `docs/`
- **Category:** Docs Bundle Diff
- **Impact:** No action needed. Portal-specific docs belong in the portal repo, not here.
- **Fix:** Mark as SKIP. Portal handoff docs are out of scope for chat monorepo reconciliation.
