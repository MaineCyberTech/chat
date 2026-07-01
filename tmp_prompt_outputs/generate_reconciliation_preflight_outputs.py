"""
Generate reconciliation preflight bundle outputs.
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
# 1. Reconciliation Master Prompt
# ============================================================
prompts.append({
    "prompt_name": "reconciliation_master",
    "domain": "reconciliation",
    "stage": "reconciliation",
    "decision": "GO WITH RISKS",
    "generated_at": now,
    "severity_counts": {"P0": 1, "P1": 3, "P2": 4, "P3": 5},
    "category_scores": {"ci_cd": 70, "api": 65, "web": 60, "worker": 50, "docs": 70, "infra_terraform": 65, "supabase": 70, "scripts_tooling": 60, "shared_packages": 55},
    "readiness": 63.0,
    "findings": [
        {"severity": "P0", "domain": "reconciliation", "category": "supabase",
         "file": "supabase/migrations/",
         "issue": "Migration sequence gap in 20260626 batch — jumps from 01 to 22; 21 missing sequence numbers suggesting deleted or renumbered migrations",
         "impact": "Migration history ambiguity; Supabase CLI tracking by filename may detect conflicts; potential ordering issues on fresh db.push",
         "fix": "Audit migration sequence; renumber with contiguous numbers; verify all migrations apply cleanly from scratch"},
        {"severity": "P1", "domain": "reconciliation", "category": "api",
         "file": "apps/api/src/modules/feature-flags/routes.ts",
         "issue": "Feature-flag middleware broken: requireWorkspaceMembership('workspaceId') on paths without :workspaceId param — all feature-flag requests fail with 400",
         "impact": "Feature flags completely non-functional across all workspaces",
         "fix": "Remove requireWorkspaceMembership from feature-flag routes or add workspaceId as query/body param"},
        {"severity": "P1", "domain": "reconciliation", "category": "ci_cd",
         "file": ".github/workflows/deploy-production.yml",
         "issue": "No production approval gate — push to main immediately deploys to production without any manual review step",
         "impact": "Any code merged to main can deploy to production with zero human oversight",
         "fix": "Add environment: production with required reviewers to deploy job"},
        {"severity": "P1", "domain": "reconciliation", "category": "infra_terraform",
         "file": "infra/terraform/versions.tf",
         "issue": "Terraform state key hardcoded with no environment interpolation — dev and prod share the same state",
         "impact": "Parallel state operations on dev and prod can corrupt Terraform state",
         "fix": "Use ${var.environment} in backend key to isolate environment state"},
        {"severity": "P2", "domain": "reconciliation", "category": "worker",
         "file": "apps/worker/",
         "issue": "Worker package has no health endpoint, no test script, no logging — completely unobservable",
         "impact": "Worker failures invisible; no monitoring or alerting for background job failures",
         "fix": "Add health endpoint, structured logging, and basic metric instrumentation to apps/worker"},
        {"severity": "P2", "domain": "reconciliation", "category": "shared_packages",
         "file": "packages/db/src/types.ts",
         "issue": "TypeScript types severely out of sync with DB schema — 6 interfaces vs 16 tables; soft-delete fields missing",
         "impact": "Type safety gaps across codebase; developers forced to use 'any'",
         "fix": "Regenerate types via supabase gen types typescript; add CI drift check"},
        {"severity": "P2", "domain": "reconciliation", "category": "ci_cd",
         "file": ".github/workflows/governance.yml",
         "issue": "governance.yml and platform.yml workflows broken — reference 5 nonexistent scripts",
         "impact": "CI noise on every push; no actual governance enforcement",
         "fix": "Fix or disable broken workflows; consolidate into working evaluate_gate.py"},
        {"severity": "P2", "domain": "reconciliation", "category": "script_tooling",
         "file": "",
         "issue": "Playwright test results directory checkpoints (.playwright-results/) not gitignored",
         "impact": "Test artifacts may be accidentally committed, bloating repo size",
         "fix": "Add .playwright-results/ to .gitignore"},
        {"severity": "P3", "domain": "reconciliation", "category": "docs",
         "file": "docs/runbooks/database-migrations.md",
         "issue": "Runbook references packages/db/sql/migrations/ directory which no longer exists",
         "impact": "Operators following runbook will look in wrong directory",
         "fix": "Update runbook to reference supabase/migrations/ as single migration source"},
        {"severity": "P3", "domain": "reconciliation", "category": "web",
         "file": "apps/web/",
         "issue": "No loading.tsx in route groups — no Suspense fallback for page transitions",
         "impact": "Page transitions show blank screen while data loads",
         "fix": "Add loading.tsx with Skeleton components to each route group"},
        {"severity": "P3", "domain": "reconciliation", "category": "docs",
         "file": "",
         "issue": "No dependabot configuration (.github/dependabot.yml) for automated dependency updates",
         "impact": "Dependency vulnerabilities may go unnoticed until manually discovered",
         "fix": "Create .github/dependabot.yml with weekly npm + GitHub Actions checks"},
        {"severity": "P3", "domain": "reconciliation", "category": "api",
         "file": "",
         "issue": "No CONTRIBUTING.md or PR/issue templates to guide new contributors",
         "impact": "Inconsistent PR submissions; higher friction for new contributors",
         "fix": "Add CONTRIBUTING.md, PR template, and issue templates"},
        {"severity": "P3", "domain": "reconciliation", "category": "infra_terraform",
         "file": "infra/terraform/variables.tf",
         "issue": "Default droplet size still s-1vcpu-512mb-10gb despite known OOM (documented in AGENTS.md)",
         "impact": "New droplets provisioned with undersized spec; OOM under normal load",
         "fix": "Update default droplet_size to s-2vcpu-2gb in variables.tf"}
    ]
})

# ============================================================
# 2. Pre-Reconciliation Checklist
# ============================================================
prompts.append({
    "prompt_name": "pre_reconciliation_checklist",
    "domain": "reconciliation",
    "stage": "reconciliation",
    "decision": "GO WITH RISKS",
    "generated_at": now,
    "severity_counts": {"P0": 1, "P1": 2, "P2": 5, "P3": 4},
    "category_scores": {"repo_state_safety": 80, "build_test_baseline": 70, "environment_deployment": 55, "review_scope": 75, "approval_gates": 45},
    "readiness": 65.0,
    "findings": [
        {"severity": "P0", "domain": "reconciliation", "category": "approval_gates",
         "file": ".github/workflows/deploy-production.yml",
         "issue": "Changes to deployment workflows and infra/terraform can be applied without human approval — no required reviewers on deploy jobs",
         "impact": "Critical deployment/infra changes can reach production without review, violating approval gate requirements",
         "fix": "Add environment: production with required reviewers; add CODEOWNERS for infra/ and .github/workflows/"},
        {"severity": "P1", "domain": "reconciliation", "category": "environment_deployment",
         "file": ".github/workflows/supabase-migrations.yml",
         "issue": "Single SUPABASE_PROJECT_REF for both dev and prod — no separate Supabase project per environment",
         "impact": "Migrations from develop directly affect same database as main",
         "fix": "Use separate Supabase projects with separate project ref secrets per environment"},
        {"severity": "P1", "domain": "reconciliation", "category": "build_test_baseline",
         "file": "tests/",
         "issue": "E2E tests all marked test.skip — zero E2E coverage despite having 48 test stubs and Playwright configured",
         "impact": "No E2E baseline before edits; cannot detect UI regression during reconciliation",
         "fix": "Establish at minimum auth and workspace E2E tests as baseline before reconciliation edits"},
        {"severity": "P2", "domain": "reconciliation", "category": "environment_deployment",
         "file": ".github/workflows/",
         "issue": "SMTP/email env vars not set in any deployment workflow — SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM all missing",
         "impact": "Password reset and transactional emails non-functional in deployed environments",
         "fix": "Add SMTP configuration secrets to all deploy workflows"},
        {"severity": "P2", "domain": "reconciliation", "category": "repo_state_safety",
         "file": "",
         "issue": "Multiple .env.example files exist across apps with inconsistent variable coverage — no single source of truth for required env vars",
         "impact": "New environment setup requires cross-referencing multiple files; missing vars not caught until runtime",
         "fix": "Consolidate to root .env.example as canonical source; validate all vars documented"},
        {"severity": "P2", "domain": "reconciliation", "category": "environment_deployment",
         "file": "infra/terraform/",
         "issue": "No Terraform plan step in deploy workflows — terraform apply runs without plan review",
         "impact": "Infrastructure changes applied without human review of planned changes",
         "fix": "Add terraform plan step with approval gate before apply"},
        {"severity": "P2", "domain": "reconciliation", "category": "approval_gates",
         "file": "",
         "issue": "No explicit CODEOWNERS file defining required reviewers for sensitive paths",
         "impact": "Anyone can modify auth, DB, infra, or deployment files without specialized review",
         "fix": "Create CODEOWNERS: @MaineCyberTech/security for auth/supabase/, @MaineCyberTech/infra for terraform/, @MaineCyberTech/ops for deploy workflows"},
        {"severity": "P2", "domain": "reconciliation", "category": "build_test_baseline",
         "file": "apps/worker/",
         "issue": "Worker package has no test script configured in package.json",
         "impact": "Worker code changes during reconciliation have zero test coverage",
         "fix": "Add vitest config and test script to apps/worker/package.json"},
        {"severity": "P3", "domain": "reconciliation", "category": "repo_state_safety",
         "file": "",
         "issue": "No checkpoint branch created before reconciliation — no git tag marking pre-reconciliation state",
         "impact": "Cannot easily revert to pre-reconciliation state if edits cause issues",
         "fix": "Create git tag pre-reconciliation-baseline before any reconciliation edits"},
        {"severity": "P3", "domain": "reconciliation", "category": "build_test_baseline",
         "file": "",
         "issue": "No baseline captured for lint/typecheck/test pass before reconciliation edits",
         "impact": "Cannot distinguish pre-existing failures from reconciliation-introduced issues",
         "fix": "Run and capture pnpm lint, pnpm typecheck, pnpm test output as baseline artifact"},
        {"severity": "P3", "domain": "reconciliation", "category": "review_scope",
         "file": "",
         "issue": "Playwright test results (.playwright-results/) and generated coverage reports not gitignored",
         "impact": "Generated artifacts may be committed during reconciliation file passes",
         "fix": "Add .playwright-results/ and coverage/ to .gitignore"},
        {"severity": "P3", "domain": "reconciliation", "category": "approval_gates",
         "file": "",
         "issue": "No explicit documentation of which files/folders are off-limits during reconciliation",
         "impact": "Reconciliation AI may modify critical config files without understanding impact",
         "fix": "Document off-limits paths: apps/api/src/config/, supabase/migrations/, infra/terraform/, .github/workflows/deploy-*"}
    ]
})

# ============================================================
# 3. Visible Diff Areas Analysis
# ============================================================
prompts.append({
    "prompt_name": "visible_diff_areas_analysis",
    "domain": "reconciliation",
    "stage": "reconciliation",
    "decision": "GO WITH RISKS",
    "generated_at": now,
    "severity_counts": {"P0": 0, "P1": 3, "P2": 4, "P3": 3},
    "category_scores": {"workflow_differences": 70, "terraform_workflow": 60, "vercel_deployment": 45, "repo_tooling": 60, "docs_content": 65, "supabase_drift": 70, "package_config": 75, "web_app": 55},
    "readiness": 62.0,
    "findings": [
        {"severity": "P1", "domain": "reconciliation", "category": "workflow_differences",
         "file": ".github/workflows/",
         "issue": "Workflows use pnpm/action-setup@v4 and actions/setup-node@v4 caching patterns but no Corepack-based pnpm enablement (visible in reference pattern)",
         "impact": "CI workflows may fail if pnpm version is not pinned; no deterministic pnpm version across environments",
         "fix": "Add corepack enable and pnpm version pinning to all CI workflows; keep existing setup-node caching"},
        {"severity": "P1", "domain": "reconciliation", "category": "vercel_deployment",
         "file": "",
         "issue": "No Vercel deployment workflow exists — frontend is deployed via Docker on DO droplet, not Vercel",
         "impact": "Vercel workflow is not applicable; existing Docker-based deployment is correct for current architecture",
         "fix": "No action needed — Docker deployment is intentional. Document as architectural decision."},
        {"severity": "P1", "domain": "reconciliation", "category": "repo_tooling",
         "file": "",
         "issue": "No .github/dependabot.yml exists — reference pattern shows this file in develop snapshot",
         "impact": "No automated dependency update monitoring; vulnerability patches require manual tracking",
         "fix": "Create .github/dependabot.yml with weekly npm + GitHub Actions ecosystem checks"},
        {"severity": "P2", "domain": "reconciliation", "category": "terraform_workflow",
         "file": ".github/workflows/",
         "issue": "No Terraform stale lock cleanup logic in workflows — reference pattern shows tfvars file creation from secrets",
         "impact": "Terraform apply may fail on stale lock files in multi-worker scenarios",
         "fix": "Add stale lock cleanup step (terraform init -lockfile=readonly) before apply in terraform workflows"},
        {"severity": "P2", "domain": "reconciliation", "category": "repo_tooling",
         "file": "",
         "issue": "Husky pre-commit hook exists and works but has deprecation warnings about v10 migration",
         "impact": "Pre-commit hook will fail after husky v10 update",
         "fix": "Remove deprecated husky .husky.sh reference lines from pre-commit file; prepare for v10 syntax"},
        {"severity": "P2", "domain": "reconciliation", "category": "web_app",
         "file": "",
         "issue": "No instrumentation.ts or Vercel-specific config — reference pattern shows these as differences",
         "impact": "These are Vercel-specific files not applicable to Docker deployment. Confirm as intentional skip.",
         "fix": "No action needed — document as intentional architectural difference from reference pattern"},
        {"severity": "P2", "domain": "reconciliation", "category": "supabase_drift",
         "file": "supabase/migrations/",
         "issue": "Reference pattern shows additional migrations (5302034_ticket_comment_editing.sql, 5302035_bootstrap_portal_access.sql) for a different project",
         "impact": "These migrations are for the MCT Portal, not the Chat app — confirm they should NOT be adopted",
         "fix": "No action needed — document as belonging to separate project. If Chat needs similar features, design new Chat-specific migrations."},
        {"severity": "P3", "domain": "reconciliation", "category": "package_config",
         "file": "",
         "issue": "Reference pattern uses .mjs config files (eslint.config.mjs, jest.config.mjs) — current repo uses .ts/.js",
         "impact": "Cosmetic naming difference; both work. Standardizing is optional.",
         "fix": "Defer: adopt .mjs for future config files but do not rename existing ones now"},
        {"severity": "P3", "domain": "reconciliation", "category": "docs_content",
         "file": "",
         "issue": "Reference pattern has docs/portal_platform_formal_handoff_bundle/ — our repo has docs/architecture/ and docs/audits/ instead",
         "impact": "Different documentation structure — intentional, project-specific organization",
         "fix": "No action needed — Chat app has its own documentation structure that should be preserved"},
        {"severity": "P3", "domain": "reconciliation", "category": "docs_content",
         "file": "",
         "issue": "No load-testing README exists — reference pattern shows scripts/load-testing/README.md",
         "impact": "Load testing documentation gap; k6 scripts exist but undocumented",
         "fix": "Add README.md to tests/k6/ explaining how to run load tests and interpret results"}
    ]
})

# ============================================================
# 4. Chat Repo Intake
# ============================================================
prompts.append({
    "prompt_name": "chat_repo_intake",
    "domain": "reconciliation",
    "stage": "reconciliation",
    "decision": "GO WITH RISKS",
    "generated_at": now,
    "severity_counts": {"P0": 0, "P1": 3, "P2": 2, "P3": 2},
    "category_scores": {"structure_inventory": 85, "dependency_model": 70, "shared_surface": 50, "integration_recommendations": 65},
    "readiness": 67.0,
    "findings": [
        {"severity": "P1", "domain": "reconciliation", "category": "shared_surface",
         "file": "",
         "issue": "Chat app shares Tailwind CSS configuration strategy with MCT Portal (both use Tailwind v4 with @theme directive) but no shared theme package exists",
         "impact": "Theme changes must be duplicated across projects; design token drift between Chat and Portal",
         "fix": "Create shared @chat/theme package with common design tokens; both apps import from shared package"},
        {"severity": "P1", "domain": "reconciliation", "category": "integration_recommendations",
         "file": "",
         "issue": "Chat app uses same Supabase project pattern as Portal but has separate migrations — potential schema conflicts if both apps access same Supabase project",
         "impact": "Table naming conflicts; RLS policy overlaps; accidental cross-app data access",
         "fix": "Verify Chat and Portal use separate Supabase projects; if shared, add table name prefixing (chat_) and separate RLS policies"},
        {"severity": "P1", "domain": "reconciliation", "category": "dependency_model",
         "file": "",
         "issue": "Chat app uses pnpm workspace monorepo with packages/ shared across apps — but Portal may have its own versions of similar packages",
         "impact": "Duplicate implementations of Button, Input, Dialog, etc. between Chat and Portal; no shared UI component library",
         "fix": "Audit @chat/ui components vs Portal equivalents; extract shared components to @mct/ui package"},
        {"severity": "P2", "domain": "reconciliation", "category": "structure_inventory",
         "file": "",
         "issue": "Chat app uses same-domain /v1/* proxy architecture for API; Portal may use direct subdomain or different pattern",
         "impact": "Integration between Chat and Portal requires consistent API routing strategy",
         "fix": "Document API routing architecture decision; align with Portal if integration is planned"},
        {"severity": "P2", "domain": "reconciliation", "category": "integration_recommendations",
         "file": "",
         "issue": "Chat app uses Socket.io for real-time; Portal likely uses different WebSocket approach",
         "impact": "Cross-app real-time communication (Portal notifications about Chat activity) requires bridge",
         "fix": "Design cross-app event bus (Redis pub/sub or NATS) if Chat and Portal need real-time integration"},
        {"severity": "P3", "domain": "reconciliation", "category": "dependency_model",
         "file": "",
         "issue": "Chat app includes Sentry-instrumented error boundaries; Portal likely has similar instrumentation",
         "impact": "Potential Sentry DSN/org duplication; separate error tracking silos",
         "fix": "Consolidate Sentry projects under single org; share DSN naming convention"},
        {"severity": "P3", "domain": "reconciliation", "category": "integration_recommendations",
         "file": "",
         "issue": "Chat app version badge shows branch+SHA+build date; Portal version scheme unknown",
         "impact": "Inconsistent version identification across products",
         "fix": "Standardize version badge format across Chat and Portal; share version utility"}
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
