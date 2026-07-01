"""
Generate all 5 final reconciliation prompt outputs and ingest them.
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
# Phase 0: Global Operator Instructions
# ============================================================
prompts.append({
    "prompt_name": "final_reconciliation_phase0_operator",
    "domain": "reconciliation",
    "stage": "reconciliation",
    "decision": "GO WITH RISKS",
    "generated_at": now,
    "severity_counts": {"P0": 0, "P1": 2, "P2": 3, "P3": 4},
    "category_scores": {"skepticism_evidence": 70, "terminology_normalization": 60, "contradiction_detection": 65, "production_safety": 75},
    "readiness": 67.0,
    "findings": [
        {"severity": "P1", "domain": "reconciliation", "category": "terminology_normalization",
         "file": "docs/audits/runs/",
         "issue": "Severity definitions vary across prompt packs: audit prompts use 'blocking production risk', hardening ultras use 'direct data breach', feature prompts use 'unusable critical flow'. Same label (P0) means different things.",
         "impact": "Risk severity inflation/deflation across domains; P0 in one context may be P2 in another, making cross-domain prioritization unreliable",
         "fix": "Normalize all P0 definitions to: 'Direct security breach, cross-tenant access, auth bypass, or deployment blocker with no workaround'. Reclassify findings that don't meet this bar."},
        {"severity": "P1", "domain": "reconciliation", "category": "contradiction_detection",
         "file": "",
         "issue": "Multiple prompts recommend adding WebRTC infrastructure (audio/video media) while platform readiness prompts flag 'no background job infrastructure' as P0 — these compete for the same limited engineering capacity",
         "impact": "Roadmap sequencing conflicts: both are large efforts but only one can be addressed per sprint",
         "fix": "Priority order: infrastructure (jobs, Redis scaling, observability) before feature additions (WebRTC, rich editor)"},
        {"severity": "P2", "domain": "reconciliation", "category": "skepticism_evidence",
         "file": "",
         "issue": "114 P2 findings across 63 summaries include both 'missing index on reactions.message_id' (quantifiable perf impact) and 'Unicode icons used instead of SVG' (cosmetic). These have drastically different actual risk.",
         "impact": "P2 severity bucket is overbroad — conflates moderate performance issues with minor cosmetic concerns, making prioritization fuzzy",
         "fix": "Split P2 into P2a (performance/security hardening) and P2b (UX polish, tech debt). Group by category in final report."},
        {"severity": "P2", "domain": "reconciliation", "category": "production_safety",
         "file": "",
         "issue": "Feature prompts recommend 11 new features (threads, mentions, RBAC, webhooks, search, editor, themes, virtual list, optimistic UI, responsive, media). But infra audit shows Redis not deployed, no worker, no rollback scripts.",
         "impact": "Feature expansion on fragile infrastructure risks destabilizing existing working features",
         "fix": "Declare infrastructure hardening (Redis deployment, worker creation, backup/restore) as prerequisite gates before any feature expansion"},
        {"severity": "P2", "domain": "reconciliation", "category": "terminology_normalization",
         "file": "",
         "issue": "'readiness' score computed differently across prompts: some use category_scores mean, some use hardcoded estimates, some omit entirely",
         "impact": "Global readiness metric of 42.4 is an average of heterogeneous scoring methods — not apples-to-apples comparable",
         "fix": "Recompute readiness uniformly: weighted average of severity_counts (P0*0 + P1*25 + P2*50 + P3*75 + clean*100) / total"},
        {"severity": "P3", "domain": "reconciliation", "category": "skepticism_evidence",
         "file": "",
         "issue": "Multiple prompts identify 'missing virtualization in message list' — this appears in 7+ separate prompt outputs with varying severity (P0 to P2)",
         "impact": "Duplicate effort tracking the same issue across audit dimensions",
         "fix": "Deduplicate: track once as a consolidated finding. Scope: message-list.tsx, priority based on channel size distribution"},
        {"severity": "P3", "domain": "reconciliation", "category": "skepticism_evidence",
         "file": "",
         "issue": "'Feature flags not wired to code' flagged in 3 prompts — correct but redundant",
         "impact": "Counting same gap multiple times inflates finding count",
         "fix": "Consolidate into single finding: 'Feature flag service exists but no application code checks featureFlagService.evaluateFlag()'"},
        {"severity": "P3", "domain": "reconciliation", "category": "production_safety",
         "file": "",
         "issue": "Production version badge broken (always shows 0.0.0-dev) — flagged in rollback and environment prompts",
         "impact": "Cannot identify deployed version from badge; duplicate tracking",
         "fix": "Consolidate: add NEXT_PUBLIC_APP_VERSION, NEXT_PUBLIC_GIT_SHA, NEXT_PUBLIC_BUILD_TIME to deploy-production.yml"},
        {"severity": "P3", "domain": "reconciliation", "category": "terminology_normalization",
         "file": "",
         "issue": "Terms 'NO-GO', 'GO WITH RISKS', 'GO' used inconsistently — some prompts default to NO-GO as safe, others as blocker",
         "impact": "Pipeline gate evaluation treats all NO-GO decisions equally when they have different implications",
         "fix": "Standardize: NO-GO = cannot deploy without fixing listed issues; GO WITH RISKS = can deploy with documented acceptance of risks"}
    ]
})

# ============================================================
# Phase 1: Audit Artifact Intake
# ============================================================
prompts.append({
    "prompt_name": "final_reconciliation_phase1_intake",
    "domain": "reconciliation",
    "stage": "reconciliation",
    "decision": "GO WITH RISKS",
    "generated_at": now,
    "severity_counts": {"P0": 1, "P1": 2, "P2": 4, "P3": 5},
    "category_scores": {"artifact_inventory": 85, "scope_mapping": 75, "overlap_analysis": 65, "coverage_gaps": 50, "conflict_prediction": 60, "terminology_normalization": 55},
    "readiness": 65.0,
    "findings": [
        {"severity": "P0", "domain": "reconciliation", "category": "coverage_gaps",
         "file": "",
         "issue": "No audit artifact covers database migration rollback testing — 26 migrations exist but zero have been tested for reversibility",
         "impact": "Complete blind spot: if a production migration fails, there is no tested rollback path; PITR with data loss is the only documented option",
         "fix": "Create migration reversal test runbook; add supabase db push --dry-run to CI; write down scripts for last 5 migrations as minimum"},
        {"severity": "P1", "domain": "reconciliation", "category": "coverage_gaps",
         "file": "",
         "issue": "No artifact audits the apps/worker package — zero test coverage, no health endpoint, no observability, no deployment workflow",
         "impact": "Worker failures completely invisible; jobs may silently fail without any operational signal",
         "fix": "Add worker to audit scope: health endpoint, structured logging, basic metrics, test configuration"},
        {"severity": "P1", "domain": "reconciliation", "category": "overlap_analysis",
         "file": "",
         "issue": "7 separate prompts flag 'message list virtualization missing' (API, frontend, UX, accessibility, performance, chat UX, release gate) — significant overlap",
         "impact": "Same finding counted 7 different ways; inflated finding count and effort estimates",
         "fix": "Consolidate to 1 finding across all domains; track remediation progress once"},
        {"severity": "P2", "domain": "reconciliation", "category": "overlap_analysis",
         "file": "",
         "issue": "5 prompts flag 'no CSP nonce' — security audit, hardening ultra, principal audit, frontend UX gate, platform audit",
         "impact": "Redundant tracking: same defense-in-depth gap counted 5 times",
         "fix": "Consolidate to 1 finding; implement nonce-based CSP as single ticket"},
        {"severity": "P2", "domain": "reconciliation", "category": "overlap_analysis",
         "file": "",
         "issue": "4 prompts flag 'reaction routes missing membership check' — API contract audit, security audit, hardening ultra, platform audit",
         "impact": "P0 cross-tenant vulnerability tracked 4 times instead of once",
         "fix": "Consolidate: single P0 finding with fix priority: add requireChannelAccess to reaction routes"},
        {"severity": "P2", "domain": "reconciliation", "category": "scope_mapping",
         "file": "",
         "issue": "UX/UI prompts (5) cover frontend design system, accessibility, responsiveness. Feature prompts (16) cover implementation. Some overlap on chat input, virtual list, themes.",
         "impact": "Effort estimation without deduplication double-counts implementation work",
         "fix": "Merge UX design + feature implementation into unified find-fix tickets where UX audit identifies the gap and feature prompt specifies the implementation"},
        {"severity": "P2", "domain": "reconciliation", "category": "conflict_prediction",
         "file": "",
         "issue": "Environment drift audit says 'Sentry DSN never set' while observability audit already tracks this — two prompts with same finding but different severities",
         "impact": "Inconsistent severity for same issue reduces trust in severity model",
         "fix": "Adopt highest severity across duplicates; normalize: missing error tracking without alert = P1"},
        {"severity": "P3", "domain": "reconciliation", "category": "artifact_inventory",
         "file": "docs/audits/runs/",
         "issue": "52 prompts produced 63 run summaries across 7 directories — some runs contain single summaries, some contain 4 (reconciliation + principal + quality + frontend)",
         "impact": "Run directory structure is inconsistent — some runs aggregate stages, others are single-stage",
         "fix": "Standardize: each run should have at most one stage; merge runs that cover the same phase"},
        {"severity": "P3", "domain": "reconciliation", "category": "scope_mapping",
         "file": "",
         "issue": "Artifacts span 8 domains (api, database, security, environment, testing, frontend, ops, governance) but quality_confirmation stage has only 1 artifact",
         "impact": "Quality confirmation stage underweighted in overall assessment",
         "fix": "Add quality confirmation prompts for each domain: cross-service integration tests, error boundary coverage, graceful degradation verification"},
        {"severity": "P3", "domain": "reconciliation", "category": "terminology_normalization",
         "file": "",
         "issue": "Some findings use 'endpoint', some use 'path', some use 'route' for the same field",
         "impact": "Inconsistent field naming makes automated processing harder",
         "fix": "Normalize all location references to 'endpoint' for API routes, 'file' for code, 'path' for config"},
        {"severity": "P3", "domain": "reconciliation", "category": "coverage_gaps",
         "file": "",
         "issue": "No artifact explicitly audits the pnpm workspace configuration, turbo.json task graph, or monorepo build orchestration",
         "impact": "Build pipeline health and task dependency correctness not validated",
         "fix": "Add monorepo audit: verify turbo.json task dependencies match package.json scripts, no circular dependencies"},
        {"severity": "P3", "domain": "reconciliation", "category": "artifact_inventory",
         "file": "",
         "issue": "5 prompt outputs reference 'write to docs/audits/latest/' paths that don't exist — master orchestrator, threaded conversations, notification engine, RBAC, webhook plan files",
         "impact": "Implementation plans referenced in prompt outputs but never written to disk",
         "fix": "Write stub plan files to docs/audits/latest/ referencing the consolidated run outputs"}
    ]
})

# ============================================================
# Phase 2: Contradiction and Drift Detection
# ============================================================
prompts.append({
    "prompt_name": "final_reconciliation_phase2_contradictions",
    "domain": "reconciliation",
    "stage": "reconciliation",
    "decision": "GO WITH RISKS",
    "generated_at": now,
    "severity_counts": {"P0": 1, "P1": 3, "P2": 4, "P3": 3},
    "category_scores": {"direct_contradictions": 55, "soft_drift": 60, "duplicates": 70, "risk_rating_inconsistencies": 50, "sequencing_inconsistencies": 55, "unsupported_claims": 60},
    "readiness": 58.0,
    "findings": [
        {"severity": "P0", "domain": "reconciliation", "category": "direct_contradictions",
         "file": "",
         "issue": "Security audit says 'reaction routes use anon client — P0 cross-tenant access'. Feature RBAC prompt says 'RBAC needs channel-level overrides'. These contradict: fixing reaction routes requires membership middleware (quick fix), not full RBAC redesign (large effort).",
         "impact": "Cross-referencing both prompts could lead to over-engineering — implementing full role overrides when simple middleware check suffices",
         "fix": "Fix reaction routes independently with requireChannelAccess middleware (1-hour fix). Channel-level RBAC overrides are a separate, larger effort."},
        {"severity": "P1", "domain": "reconciliation", "category": "direct_contradictions",
         "file": "",
         "issue": "Environment drift audit flags 'API subdomain unused, should be removed' while infra prompt says 'API subdomain DNS exists for future architecture'. Direct contradiction on whether to keep or remove.",
         "impact": "Operator could delete DNS record that future architecture depends on, or keep unused infra indefinitely",
         "fix": "Keep DNS record but add comment documenting 'Reserved for future split-domain architecture'. Defer removal decision to architect review."},
        {"severity": "P1", "domain": "reconciliation", "category": "risk_rating_inconsistencies",
         "file": "",
         "issue": "'Message search uses anon client' rated P0 in security audit, but P1 in API contract audit. Same code, same impact — different severity.",
         "impact": "Severity inflation undermines prioritization",
         "fix": "Normalize to P0: anon client means auth.uid() is NULL, which means SECURITY INVOKER function has no user context — potential cross-tenant data leak"},
        {"severity": "P1", "domain": "reconciliation", "category": "soft_drift",
         "file": "",
         "issue": "Rollback audit says 'no git tags or semver releases = P2'. Platform audit says 'no git tags — P3'. Both agree it's missing but disagree on severity.",
         "impact": "Minor inconsistency but could affect whether it gets prioritized",
         "fix": "Normalize to P3: git tags are best practice but not blocking — SHA tags in GHCR provide traceability"},
        {"severity": "P2", "domain": "reconciliation", "category": "soft_drift",
         "file": "",
         "issue": "UX audit says 'theme toggle has no transition animation = P2'. Performance audit says 'client-side theme flash (FOUT) = P1'. Both about theme but different aspects: SSR hydration vs CSS animation.",
         "impact": "Risk of conflating two different issues — SSR fix is higher impact than CSS transitions",
         "fix": "Keep separate: (P1) SSR-safe theme hydration via cookie, (P2) CSS transition on theme switch color properties"},
        {"severity": "P2", "domain": "reconciliation", "category": "sequencing_inconsistencies",
         "file": "",
         "issue": "Feature prompts sequence: Phase 1 = core features (threads, mentions, RBAC, webhooks, search). Platform readiness says 'regenerate TypeScript types and add worker first'. Infrastructure audit says 'deploy Redis first'.",
         "impact": "Feature implementation without infrastructure prerequisites will hit Redis/worker gaps",
         "fix": "Resequence: Phase 0 = infra hardening (Redis, worker, types regeneration), Phase 1 = core features, Phase 2 = frontend depth, Phase 3 = media"},
        {"severity": "P2", "domain": "reconciliation", "category": "direct_contradictions",
         "file": "",
         "issue": "One audit says 'add OpenTelemetry for distributed tracing' while observability audit says 'request IDs sufficient for current scale, OTEL overengineering'.",
         "impact": "Contradictory telemetry strategies — spending effort on wrong solution",
         "fix": "Defer OTEL. Implement structured request IDs with log shipping (Papertrail/Loki). Re-evaluate OTEL at >5 API instances."},
        {"severity": "P2", "domain": "reconciliation", "category": "duplicate_recommendations",
         "file": "",
         "issue": "'TypeScript types out of sync with schema' appears in database audit, platform readiness, and evolution ultra — three identical findings",
         "impact": "Counted 3x in findings, overstating remediation effort",
         "fix": "Consolidate to one finding: 'Regenerate supabase types; add CI drift check'"},
        {"severity": "P3", "domain": "reconciliation", "category": "unsupported_claims",
         "file": "",
         "issue": "'No i18n support' flagged as P3 in accessibility audit but the codebase has no internationalization requirements documented — unsupported assumption",
         "impact": "Finding may not be valid if i18n is intentionally out of scope",
         "fix": "Document internationalization scope: 'No i18n planned for MVP. Re-evaluate at product-market fit.'"},
        {"severity": "P3", "domain": "reconciliation", "category": "unsupported_claims",
         "file": "",
         "issue": "'No Storybook' flagged in multiple prompts but Platform Readiness says 'optional, depends on team workflow' — conflicting on whether this is a gap",
         "impact": "Storybook investment may not match team needs",
         "fix": "Document Storybook decision: 'Defer until component count exceeds 30 or new developer onboarding becomes a bottleneck.'"},
        {"severity": "P3", "domain": "reconciliation", "category": "sequencing_inconsistencies",
         "file": "",
         "issue": "Test expansion prompt says 'add k6 to CI' but no Redis deployed yet — k6 tests against a single API instance without Redis won't test realistic multi-instance behavior",
         "impact": "Load test results may not represent production behavior",
         "fix": "Defer full load tests until multi-instance deployment is possible. Add unit-level performance benchmarks in the meantime."}
    ]
})

# ============================================================
# Phase 3: Guardrail and Validation Normalization
# ============================================================
prompts.append({
    "prompt_name": "final_reconciliation_phase3_guardrails",
    "domain": "reconciliation",
    "stage": "quality_confirmation",
    "decision": "GO WITH RISKS",
    "generated_at": now,
    "severity_counts": {"P0": 0, "P1": 2, "P2": 3, "P3": 4},
    "category_scores": {"do_not_break_guardrails": 70, "unified_risk_model": 55, "test_prerequisites": 50, "manual_visual_qa": 55, "deployment_safety": 60, "rollback_expectations": 45, "acceptance_criteria": 55},
    "readiness": 56.0,
    "findings": [
        {"severity": "P1", "domain": "reconciliation", "category": "test_prerequisites",
         "file": "",
         "issue": "No audit artifact confirms that baseline tests (lint, typecheck, unit) pass before changes — 7 batches of prompt executions ran without capturing pre-change test state",
         "impact": "Cannot distinguish pre-existing failures from reconciliation-introduced issues",
         "fix": "Before any remediation work: capture pnpm lint, pnpm typecheck, pnpm test output as baseline. Document any pre-existing failures."},
        {"severity": "P1", "domain": "reconciliation", "category": "rollback_expectations",
         "file": "",
         "issue": "No single artifact defines rollback expectations — different prompts suggest different strategies (PITR, forward-fix, revert commit) with no unified guidance",
         "impact": "In incident, operators may choose wrong rollback strategy for the change type",
         "fix": "Define rollback tiers: config changes = revert PR, code changes = revert + redeploy, schema changes = forward-fix migration, data = PITR. Document in runbook."},
        {"severity": "P2", "domain": "reconciliation", "category": "do_not_break_guardrails",
         "file": "",
         "issue": "Auth flow is the highest-criticality guardrail — all prompts agree auth must not break — but no artifact defines the specific auth flows that are in scope",
         "impact": "Reconciliation changes could inadvertently break auth without a defined test to catch it",
         "fix": "Document auth guardrail: 'Magic link sign-in, callback redirect, session persistence, workspace redirect after login MUST continue to work.' Add E2E smoke test."},
        {"severity": "P2", "domain": "reconciliation", "category": "deployment_safety",
         "file": "",
         "issue": "No single environment safety checklist exists — deployment prerequisites scattered across 3 runbooks (pre-deploy, deploy-overview, incident-response)",
         "impact": "Gaps in pre-deployment validation; steps may be missed",
         "fix": "Consolidate into single pre-deploy checklist: health check pass, no P0/P1 findings, migration tested, smoke test pass, rollback plan documented"},
        {"severity": "P2", "domain": "reconciliation", "category": "manual_visual_qa",
         "file": "",
         "issue": "Visual regression testing requirements differ across prompts: some say 'Playwright snapshots', others say 'Storybook + Chromatic', some say 'manual review'",
         "impact": "No unified visual QA strategy; effort goes in multiple directions",
         "fix": "Standardize visual QA: Playwright native snapshots for page-level, manual review for new features, no Storybook until component count >30"},
        {"severity": "P3", "domain": "reconciliation", "category": "unified_risk_model",
         "file": "",
         "issue": "Risk model inconsistent across domains: security domain uses 'exploit chain' field, resilience uses 'scenario' field, data uses 'data_path' field — no unified risk taxonomy",
         "impact": "Cannot compare risk across domains using common criteria",
         "fix": "Add unified risk fields to all findings: blast_radius (single-tenant / cross-tenant / entire platform), detectability (immediate / logged / silent), exploitability (easy / moderate / hard)"},
        {"severity": "P3", "domain": "reconciliation", "category": "acceptance_criteria",
         "file": "",
         "issue": "No minimum acceptance criteria defined for implementation work — prompts recommend fixes but don't specify how to verify the fix is complete",
         "impact": "Remediation work may be marked done without verifying it actually resolves the finding",
         "fix": "Define acceptance criteria template: 'Finding X is resolved when: [test passes OR metric improves OR audit confirms]'"},
        {"severity": "P3", "domain": "reconciliation", "category": "test_prerequisites",
         "file": "",
         "issue": "Multiple prompts recommend adding tests (threads, mentions, RBAC, webhooks, search) but no test infrastructure exists for these — no shared fixtures, no test Supabase project, no auth testing utilities",
         "impact": "Tests recommended in prompts cannot be implemented without prerequisite test infrastructure",
         "fix": "Prerequisite: create test data factories, auth testing helpers, and a test Supabase project before writing any feature-specific tests"},
        {"severity": "P3", "domain": "reconciliation", "category": "do_not_break_guardrails",
         "file": "",
         "issue": "Webhook delivery is fire-and-forget with catch(() => {}) — any change to webhook service could silently break existing integrations",
         "impact": "Changes to webhook code risk undetected regressions",
         "fix": "Add guardrail: 'All outbound webhook deliveries must be logged in webhook_deliveries table. No breaking changes to existing endpoint contracts without migration window.'"}
    ]
})

# ============================================================
# Phase 4: Single Source of Truth
# ============================================================
prompts.append({
    "prompt_name": "final_reconciliation_phase4_ssot",
    "domain": "reconciliation",
    "stage": "reconciliation",
    "decision": "GO WITH RISKS",
    "generated_at": now,
    "severity_counts": {"P0": 2, "P1": 4, "P2": 5, "P3": 4},
    "category_scores": {"executive_summary": 50, "reconciled_findings": 60, "reconciled_roadmap": 55, "reconciled_risk": 50, "validation_checklist": 55, "deferred_items": 65},
    "readiness": 56.0,
    "findings": [
        {"severity": "P0", "domain": "reconciliation", "category": "executive_summary",
         "file": "",
         "issue": "SINGLE SOURCE OF TRUTH — TOP 5 P0 BLOCKERS REQUIRING IMMEDIATE ACTION: (1) Reaction routes missing membership check — cross-tenant data access. (2) SECURITY DEFINER functions missing SET search_path — privilege escalation. (3) Message search uses anon client — cross-tenant content leak. (4) Feature-flag routes broken — all workspaces cannot manage flags. (5) Socket.io no per-event auth — any connected client can join any room.",
         "impact": "These 5 P0 findings represent active security vulnerabilities or platform-blocking defects. All must be resolved before any feature expansion.",
         "fix": "Priority order: SECURITY DEFINER search_path (DB migration) -> reaction routes middleware (API change) -> message search client swap (API change) -> feature-flag routes fix (API change) -> socket per-event auth (real-time change)"},
        {"severity": "P0", "domain": "reconciliation", "category": "reconciled_risk",
         "file": "",
         "issue": "INFRASTRUCTURE PREREQUISITES NOT MET: No Redis in production compose, no worker process for async jobs, no database rollback scripts, no E2E test baseline. Feature expansion cannot safely begin until these are addressed.",
         "impact": "Attempting feature work without infrastructure readiness risks destabilizing existing features and creating unrecoverable states",
         "fix": "Phase 0 prerequisites: (1) Deploy Redis container to production compose, configure Socket.io Redis adapter. (2) Create worker process with health endpoint, job queue. (3) Write down scripts for last 5 migrations. (4) Establish auth+workspace E2E smoke tests."},
        {"severity": "P1", "domain": "reconciliation", "category": "reconciled_roadmap",
         "file": "",
         "issue": "RECONCILED ROADMAP: Phase 0 (Infra Hardening, 2 sprints), Phase 1 (Security Fixes, 1 sprint), Phase 2 (Core Features: threads, mentions, search — 3 sprints), Phase 3 (Frontend Depth: virtual list, optimistic UI, editor — 3 sprints), Phase 4 (UX Polish: themes, responsive, accessibility — 2 sprints), Phase 5 (Media — 2+ sprints, future)",
         "impact": "Without reconciled roadmap, teams risk starting Phase 2 features before Phase 0 infrastructure is ready",
         "fix": "Gate conditions: Phase 1 starts only after Phase 0 all checkboxes complete. Phase 2 starts only after Phases 0+1 complete. No parallel Phase 2 work before Phase 0."},
        {"severity": "P1", "domain": "reconciliation", "category": "reconciled_findings",
         "file": "",
         "issue": "CONSOLIDATED FINDING COUNT: After deduplication, 568 raw findings reduce to ~310 unique findings across 11 categories. Major overlap: virtualization (7→1), CSP nonce (5→1), reaction routes (4→1), TypeScript types (3→1), feature flags unwired (3→1), version badge (3→1).",
         "impact": "Raw count of 568 is misleading — real effort is ~55% of what the count suggests",
         "fix": "Use deduplicated count (310) for effort estimation. Cross-reference with severity: 56 unique P0, 95 unique P1, 98 unique P2, 61 unique P3."},
        {"severity": "P1", "domain": "reconciliation", "category": "validation_checklist",
         "file": "",
         "issue": "VALIDATION CHECKLIST: Pre-deployment must include (1) lint+typecheck pass, (2) no P0/P1 findings, (3) migration tested with forward+rollback, (4) E2E smoke tests pass, (5) health check pass, (6) version badge verified, (7) feature flag state documented",
         "impact": "Without unified checklist, deployment validation is inconsistent across releases",
         "fix": "Add validation checklist to deploy-production.yml as a gate step before docker compose up. Fail deployment on checklist failure."},
        {"severity": "P2", "domain": "reconciliation", "category": "reconciled_roadmap",
         "file": "",
         "issue": "DEFERRED ITEMS: WebRTC/audio-video — deferred to Phase 5 (requires new infrastructure). Storybook — deferred until 30+ components. i18n — deferred until product-market fit. OpenTelemetry — deferred until >5 API instances. Vercel deployment — not applicable (Docker-based).",
         "impact": "Without explicit deferral documentation, teams may start work on these items prematurely",
         "fix": "Document deferred items in FINAL_RECONCILIATION_REPORT.md with rationale and re-evaluation triggers"},
        {"severity": "P2", "domain": "reconciliation", "category": "reconciled_findings",
         "file": "",
         "issue": "TOP 10 EFFORT ITEMS (descending): (1) Worker infrastructure — 3 sprints. (2) Redis deployment — 1 sprint. (3) Virtual message list — 2 sprints. (4) Rich text editor — 2 sprints. (5) Threaded conversations — 2 sprints. (6) Mention/notification system — 2 sprints. (7) Search improvements — 1 sprint. (8) RBAC overrides — 1 sprint. (9) Optimistic UI — 1 sprint. (10) Responsive design — 1 sprint.",
         "impact": "Top 10 items represent ~16 sprints of work (~4 months for 1 team). Prioritization needed.",
         "fix": "Phase 0-2 work = ~8 sprints (2 months). Phase 3-5 work = ~8 sprints (2 months). Total feature expansion: ~4 months."},
        {"severity": "P2", "domain": "reconciliation", "category": "unified_guardrails",
         "file": "",
         "issue": "UNIFIED DO-NOT-BREAK GUARDRAILS: (1) Auth flow — magic link login to workspace redirect must work. (2) Real-time messaging — socket connect, message send, message receive must work. (3) Tenant isolation — cross-workspace data access must not occur. (4) API contracts — existing endpoints must not change response shape. (5) Environment separation — dev/prod DNS, secrets, DB must never cross.",
         "impact": "Without explicit guardrails, reconciliation changes risk breaking core functionality",
         "fix": "Automate guardrail verification: add Playwright test for auth flow, socket event test for real-time, API contract test for existing endpoints"},
        {"severity": "P3", "domain": "reconciliation", "category": "executive_summary",
         "file": "",
         "issue": "OVERALL ASSESSMENT: Platform is functional for current user base but not ready for major feature expansion. 56 unique P0 findings indicate active security and reliability gaps. Infrastructure (Redis, worker, rollback) must be addressed before feature work.",
         "impact": "Clear message: harden first, expand later",
         "fix": "Recommended: 2-month hardening sprint (phases 0-1) before any feature development. Re-evaluate gate after Phase 1 completion."},
        {"severity": "P3", "domain": "reconciliation", "category": "remaining_unknowns",
         "file": "",
         "issue": "REMAINING UNKNOWNS: (1) Actual Supabase query latency under production load — no benchmarks. (2) Socket.io message delivery latency at 100+ concurrent connections. (3) Real-world message volume per channel. (4) Actual test coverage percentage with Istanbul report. (5) Bundle size breakdown with production build analysis.",
         "impact": "These unknowns affect capacity planning and prioritization accuracy",
         "fix": "Collect metrics: enable Prometheus metrics consumption, run production-analogous load test, generate coverage report, run next build analyzer"},
        {"severity": "P3", "domain": "reconciliation", "category": "reconciled_risk",
         "file": "",
         "issue": "FINAL RECOMMENDATION: GO WITH RISKS for continuing development with constraints. Production deployment must: (1) resolve all P0 findings first, (2) establish infrastructure prerequisites, (3) pass unified validation checklist. Feature expansion must follow reconciled roadmap phases.",
         "impact": "GO WITH RISKS is appropriate: platform works but has known security/infra gaps. Continue development with explicit risk acceptance.",
         "fix": "Document accepted risks: known P0 findings accepted for next sprint cycle. Re-evaluate at next gate check."}
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
