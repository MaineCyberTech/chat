# Reconciliation Input Index

## Authoritative Inputs

### Compare Audit Outputs

- **Path**: `docs/audits/compare/COMPARE_AUDIT_SUMMARY.md`
- **Description**: Final reconciliation of the full repo comparison (8 phases) — structural baseline, feature mapping, strengths/weaknesses, risk, roadmap, change plan, patch sets
- **Why it matters**: Primary source for infrastructure, architecture, CI/CD, and operational recommendations

### Compare Audit Phases

- `docs/audits/compare/01_INVENTORY.md` — Structural baseline of both repos
- `docs/audits/compare/02_MAPPING.md` — Folder and feature mapping
- `docs/audits/compare/03_FINDINGS.md` — Strengths, weaknesses, efficiency opportunities
- `docs/audits/compare/04_RISK.md` — Risk analysis with guardrails
- `docs/audits/compare/05_ROADMAP.md` — Staged alignment roadmap
- `docs/audits/compare/06_CHANGE_PLAN.md` — File-by-file change plan
- `docs/audits/compare/07_PATCH_SETS.md` — Patch set design

### UI/UX Audit Outputs

- **Path**: `docs/audits/frontend/UI_UX_AUDIT_SUMMARY.md`
- **Description**: Final reconciliation of the frontend UI/UX audit (8 phases) — frontend inventory, IA, visual system, a11y, findings, roadmap, change plan
- **Why it matters**: Primary source for UI component, accessibility, and visual consistency recommendations

### UI/UX Audit Phases

- `docs/audits/frontend/01_INVENTORY.md` — Frontend inventory
- `docs/audits/frontend/02_IA.md` — Information architecture analysis
- `docs/audits/frontend/03_VISUAL_SYSTEM.md` — Visual system consistency
- `docs/audits/frontend/04_A11Y_RESPONSIVENESS.md` — Accessibility + responsiveness
- `docs/audits/frontend/05_FINDINGS.md` — Comparative findings
- `docs/audits/frontend/06_ROADMAP.md` — UI/UX refinement roadmap
- `docs/audits/frontend/07_CHANGE_PLAN.md` — File-by-file frontend change plan

### Repo Structure

- `C:\temp\chat` — Current working repo (develop branch)
- `C:\temp\mainecybertech-portal` — Reference repo

### AGENTS.md

- **Path**: `AGENTS.md`
- **Description**: Architecture documentation and implementation status

## Canonical Priority of Inputs

1. **Current working behavior** (tests pass, typecheck, lint) — must not break
2. **AGENTS.md** — documented architecture and implementation status
3. **Compare Audit Summary** — architecture, infra, CI/CD, operational findings
4. **UI/UX Audit Summary** — frontend, component, a11y findings
5. **Reference repo patterns** — adopt only where beneficial and safe

## Notes for the Reconciler

- Both audits agree: current repo has cleaner architecture, reference repo has more operational maturity
- Both audits agree: selective adoption, not wholesale convergence
- Both audits identify auth, Socket.io, Caddy, and DB schema as do-not-touch areas
- The build failure (Next.js standalone EPERM on Windows) is a platform limitation, not a code issue
