# Principal Audit Report

- Prompt: **governance_policy_tiers_upgrade**
- Domain: **governance**
- Run ID: **governance_policy_tiers_upgrade_20260701_071113**
- Generated: **2026-07-01T07:11:05Z**
- Decision: **NO-GO**
- P0: **3**, P1: **4**
- P2: **3**, P3: **2**
- Readiness: **29.00**

## Findings

### P0 — No deploy-time audit gating for production — deploy-production.yml runs without evaluating gate-policy.prod.json

- **File:** `.github/workflows/deploy-production.yml`
- **Category:** enforcement
- **Impact:** P0/P1 findings can reach production with zero governance gate — the entire policy gating system is advisory
- **Fix:** Add evaluate_gate.py step to deploy-production.yml before docker compose up, using gate-policy.prod.json with fail-on-violation

### P0 — governance.yml and platform.yml workflows are broken on every push — call run_full.ps1 referencing 5 nonexistent scripts

- **File:** `.github/workflows/governance.yml`
- **Category:** enforcement
- **Impact:** CI noise on every push; no actual governance enforcement from these workflows
- **Fix:** Fix or disable governance.yml and platform.yml; consolidate into working evaluate_gate.py invocations

### P0 — Hotfix policy special_requirements (executive_signoff_required, rollback_plan_required, post_release_validation_required) are not enforced by any script

- **File:** `docs/hardening_super_bundle/policies/gate-policy.hotfix.json`
- **Category:** hotfix_controls
- **Impact:** Hotfix policy is functionally identical to RC — three compensating controls are documented but never checked
- **Fix:** Implement special_requirements enforcement in evaluate_gate.py and evaluate_promotion_gate.py

### P1 — audit-pr-gate.yml uses dev policy for ALL PRs — PRs targeting main should use RC or prod policy

- **File:** `.github/workflows/audit-pr-gate.yml`
- **Category:** enforcement
- **Impact:** PRs to production branch evaluated against permissive dev thresholds (max_p1=5 instead of max_p1=0)
- **Fix:** Make audit-pr-gate.yml policy file selection aware of target branch: dev-policy for develop, rc-policy for release/\*, prod-policy for main

### P1 — Duplicate policy file sets exist (hardening_super_bundle/policies/ and docs/audits/policies/) — risk of drift

- **File:** `docs/hardening_super_bundle/policies/`
- **Category:** enforcement
- **Impact:** Policy changes made to one set may not be reflected in the other — inconsistent gating
- **Fix:** Consolidate to single source of truth (recommend hardening/policies/) with symlinks or CI sync check

### P1 — Branch protection checks exist but only read-check and warn — no enforced required status checks on main

- **File:** `.github/workflows/validate.yml`
- **Category:** branch_protection
- **Impact:** PRs can merge to main without passing audit gates, lint, or tests — no CI enforcement
- **Fix:** Enforce branch protection via Terraform github_branch_protection resource or GitHub API; make audit-gate a required check

### P1 — No approval process for policy file changes — any PR can silently relax gate thresholds

- **File:** ``
- **Category:** policy_change_governance
- **Impact:** Developers can bypass governance by relaxing thresholds without review
- **Fix:** Add CODEOWNERS for hardening/policies/_ and hardening/rules/_ requiring senior engineer approval

### P2 — Hotfix gate not wired to any workflow — gate-policy.hotfix.json exists but no workflow references it

- **File:** ``
- **Category:** hotfix_controls
- **Impact:** Hotfix tier is defined but unused; emergencies follow production path with no hotfix-specific controls
- **Fix:** Create hotfix/\* branch workflow with hotfix-policy; implement expedited deploy path with compensating controls

### P2 — RC gate not wired to any workflow — gate-policy.rc.json exists but no workflow evaluates it

- **File:** `docs/hardening_super_bundle/policies/gate-policy.rc.json`
- **Category:** enforcement
- **Impact:** Release candidate tier is defined but completely unused in CI
- **Fix:** Add RC evaluation to release branch PRs or a pre-deploy gate in the release workflow

### P2 — No policy versioning or schema validation — policy files are ad-hoc JSON with no schema enforcement

- **File:** ``
- **Category:** policy_change_governance
- **Impact:** Invalid policy entries may be silently ignored; no backward compatibility validation
- **Fix:** Add JSON schema for policy files; add version field; validate policy format in CI

### P3 — Exceptions.json is always empty — no historical exception tracking

- **File:** `hardening/exceptions/exceptions.json`
- **Category:** enforcement
- **Impact:** Cannot audit how often policy gates were bypassed or what waivers were granted
- **Fix:** Populate exceptions.json from PR audit gate overrides; add exception review workflow

### P3 — No policy inheritance mechanism — each tier policy file is a full copy instead of extending a base

- **File:** ``
- **Category:** policy_change_governance
- **Impact:** Policy changes must be duplicated across 4 files; risk of inconsistency
- **Fix:** Implement base-policy.json with tier-specific overrides; merge at evaluation time
