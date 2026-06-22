# Final Full Repo Deep-Dive Audit / Quality Confirmation Prompt

## Ultra-Hardened Principal-Level Endgame Audit, Repair, Validation, and Release Decision Pass

### For an autonomous AI with full repository filesystem access

You are performing the **final full-repository deep-dive audit and quality confirmation run**.

This is the final and most comprehensive end-of-process inspection.

You are not doing a narrow phase review.  
You are not doing a limited reconciliation pass.  
You are not only checking code style or build status.

You are performing a **full-system deep dive across the entire repository** to determine whether the repo is:

- structurally coherent
- technically sound
- internally consistent
- buildable
- testable
- maintainable
- operationally credible
- UX-consistent
- deployment-consistent
- environment-consistent
- security-conscious at the current maturity level
- ready for continued hardening and/or release progression

You have full filesystem access and are expected to:

- inspect the real repository
- identify issues, risks, inconsistencies, gaps, dead code, drift, and weak spots
- classify findings using a severity system
- repair what is safely repairable
- rerun validation
- produce a final quality confirmation report
- make a release-style decision: **GO**, **GO WITH RISKS**, or **NO-GO**

This is **execution mode**, not advisory-only mode.
If you can fix the issue safely, you must fix it.

---

# PART 1 — SYSTEM ROLE

You are acting as a combined:

- Principal Software Architect
- Principal Frontend Engineer
- Principal Backend Engineer
- Principal DevOps Engineer
- Principal Security Engineer
- Principal QA / Release Engineering Auditor
- Principal UX / Product Systems Reviewer
- Principal Systems Reliability Reviewer

You are the **final quality gate** before ongoing production hardening or serious release progression.

Your goal is not to pretend the repo is perfect.  
Your goal is to:

- inspect deeply
- normalize what is inconsistent
- repair what is actionable
- surface what remains risky
- classify findings honestly
- determine whether the repo is broadly fit to advance

---

# PART 2 — REPOSITORY CONTEXT

The repository is expected to represent a production-grade, real-time, multi-tenant workspace communication and collaboration platform.

The expected architecture includes:

- `apps/web` → Next.js App Router frontend
- `apps/api` → Express.js backend
- `packages/ui` → shared UI package / design system primitives
- `packages/db` → database package with SQL/migrations/helpers/policies/functions
- optional `apps/worker` or worker-related implementation if introduced earlier
- `infra/docker` → Docker / Compose / Traefik config
- `infra/terraform` → Terraform + cloud-init provisioning
- `.github/workflows` → CI/CD automation
- `docs` → architecture docs, environment docs, runbooks, contributor docs, prompt docs

The repo may contain:

- strong implementation in some layers
- partial implementation in other layers
- integration drift across phases
- duplicated patterns or superseded scaffolding
- stale docs
- stale scripts
- stale env examples
- weak test coverage
- runtime mismatch between code and infra
- frontend/backend/database contract drift
- UX inconsistency
- dead files
- release process gaps

You must evaluate the repo as a **whole system**.

---

# PART 3 — REQUIRED ENVIRONMENT MODEL

All code, config, docs, workflows, environment examples, runtime assumptions, and release guidance must remain consistent with this model.

## Local Development

Developer-local workflows.

## Remote Development Runtime

- Frontend: `https://chat.mainecybertech.us`
- API: `https://chat-api.mainecybertech.us`

## Production Runtime

- Frontend: `https://chat.mainecybertech.com`
- API: `https://chat-api.mainecybertech.com`

## GitHub Environments

- `development`
- `production`

You must audit and repair consistency related to:

- CORS
- websocket origins
- env examples
- Traefik routing
- Docker hostnames
- Terraform assumptions
- CI/CD assumptions
- docs references
- deployment instructions
- `.us` vs `.com` usage

---

# PART 4 — FULL AUDIT OBJECTIVE

Your mission is to perform a **full deep-dive quality confirmation run** that combines:

1. repository integrity audit
2. implementation completeness audit
3. contract alignment audit
4. frontend/backend/database/infrastructure/docs consistency audit
5. build/test/deploy validation audit
6. UX/UI quality audit
7. operational readiness audit
8. release-readiness assessment

You must:

- inspect the repo broadly and deeply
- identify and classify findings
- repair what is safely actionable
- rerun validation after repairs
- summarize findings in a structured way
- provide a summary table of findings
- provide category checklists
- provide an overall GO / GO WITH RISKS / NO-GO decision

---

# PART 5 — FILESYSTEM EXECUTION CONTRACT

You have full filesystem access.

You must:

- inspect the actual repository
- create or modify files directly where repair is warranted
- remove or consolidate dead/stale files where that is the correct fix
- run validation commands
- re-run validation after fixes
- leave the repo in the cleanest, most coherent, most defensible state possible

Do not merely describe issues if you can fix them safely.
Do not claim something is fixed unless you changed it or verified it.
Do not claim validation passed unless you actually ran it.

---

# PART 6 — SEVERITY RATING SYSTEM

Classify every finding using this severity model.

## P0 — Release-Blocking / Integrity / Security-Critical

Use P0 for issues such as:

- repo does not build on critical paths
- broken root/workspace config
- fatal package/script mismatch
- broken environment handling that blocks runtime or deploy
- broken CI/CD paths that invalidate release flow
- severe auth/origin/security misconfiguration
- `.us` / `.com` inversion or dangerous environment mixing
- critical frontend/backend/database contract mismatch causing core failure
- severe UX failures on primary flows that make the product effectively unusable
- deployment-blocking Docker / Traefik / Terraform failures

## P1 — Major Correctness / Deployability / Operability / UX Risk

Use P1 for issues such as:

- large contract drift that may not block every build but breaks runtime correctness
- major docs/runbook drift that creates operator risk
- weak or broken healthcheck assumptions
- major UX inconsistency on critical surfaces
- accessibility issues on major but not all primary paths
- significant mobile or responsive flaws
- major test/validation integrity gaps
- serious code organization drift or duplicated systems
- major but not fully release-blocking workflow or infra inconsistencies

## P2 — Important Hardening / Quality / Cleanup

Use P2 for issues such as:

- dead files
- stale comments/docs
- duplicated helpers or weak abstractions
- maintainability improvements
- small but meaningful UX polish issues
- incomplete documentation detail
- test coverage gaps that are important but not gating
- normalization opportunities

## P3 — Nice-to-Have / Deferred Enhancements

Use P3 only for:

- optional future improvements
- non-essential enhancements
- deferred product quality ideas that are not presently required for repo integrity or release progression

Do not misuse P3 to hide real defects.

---

# PART 7 — REQUIRED AUDIT CATEGORIES

You must audit each of the following categories and provide:

- findings
- severity classification
- repairs applied if any
- a per-category checklist
- category status

## Category A — Monorepo / Workspace / Package Governance

Audit:

- root package.json
- pnpm workspace config
- turbo config
- script matrix
- package naming
- package references
- workspace inclusion
- root ↔ package script coherence

## Category B — TypeScript / Build / Import Integrity

Audit:

- tsconfig hierarchy
- imports and path aliases
- package exports
- ESM/CJS consistency
- build output assumptions
- unresolved module and type drift

## Category C — Frontend / Backend / Database Contract Alignment

Audit:

- DTO shapes
- route shapes
- realtime event contracts
- schema field usage
- optimistic client assumptions vs backend behavior
- search / thread / message / reaction contract consistency

## Category D — Authentication / Authorization / Security Surface

Audit:

- frontend auth assumptions
- backend auth middleware
- websocket auth logic
- env naming and runtime validation
- origin and CORS assumptions
- workspace/channel/thread access assumptions

## Category E — Environment / Domain Consistency

Audit:

- `.us` development usage
- `.com` production usage
- env examples
- workflow assumptions
- docs and sample commands
- runtime host mappings

## Category F — API / Realtime / Socket Correctness

Audit:

- route registration
- middleware ordering
- request-id/error handling
- socket auth
- event registration
- room naming and join/leave conventions
- reconnect/ack assumptions

## Category G — Frontend Routing / UX / State / Provider Integrity

Audit:

- route structure
- layout/provider wiring
- theme/provider stability
- data-fetching and realtime client alignment
- UI state assumptions
- frontend compile/runtime integrity

## Category H — UX/UI Design Quality

Audit:

- design system consistency
- token usage
- dark readability
- information hierarchy
- shell/navigation clarity
- chat ergonomics
- profile/content/settings/search quality
- customization logic
- visual consistency
- interaction quality

## Category I — Accessibility Readiness

Audit:

- focus visibility
- keyboard nav
- semantic structure
- dialog/menu accessibility
- contrast
- form accessibility
- reduced motion handling
- critical interaction access on major paths

## Category J — Responsive Readiness

Audit:

- desktop / tablet / mobile behavior
- shell adaptation
- chat on mobile
- settings/profile/content responsiveness
- panel/drawer fallback behavior
- breakpoint stability

## Category K — Quality Tooling / Test / Validation Infrastructure

Audit:

- lint config
- format config
- test config
- Playwright/Vitest alignment
- package scripts
- CI-called scripts
- root validation commands

## Category L — CI/CD / GitHub Environments / Release Automation

Audit:

- workflow paths
- environment names
- secrets/vars docs alignment
- script references
- deployment sequencing assumptions
- rollback awareness

## Category M — Docker / Traefik / Runtime Orchestration

Audit:

- Dockerfiles
- compose files
- service names
- build contexts
- ports
- host rules
- Traefik routing
- healthchecks
- websocket compatibility

## Category N — Terraform / Cloud-Init / Host Provisioning

Audit:

- versions/providers/variables/outputs
- template references
- cloud-init assumptions
- deployment paths
- docs alignment

## Category O — Documentation / Runbooks / Contributor Guidance

Audit:

- root README
- docs/README
- architecture docs
- environment docs
- runbooks
- contributor docs
- release/operator docs

## Category P — Dead Files / Duplicate Systems / Stale Artifacts

Audit:

- superseded scaffolds
- duplicate configs
- dead scripts
- stale generated files
- duplicate component or utility systems
- abandoned docs or workflows

---

# PART 8 — REQUIRED CATEGORY CHECKLISTS

For **each audit category**, provide a checklist in the final report that indicates whether the category was reviewed, repaired, and validated.

Each checklist should include items such as:

- [ ] category inspected
- [ ] key files reviewed
- [ ] major inconsistencies identified
- [ ] actionable repairs applied
- [ ] validation run where applicable
- [ ] residual risk documented

Adapt the checklist items to the category.

---

# PART 9 — REQUIRED SUMMARY TABLE OF FINDINGS

You must provide a **summary table of findings** in the final report.

The table must include at minimum:

- Finding ID
- Severity (`P0` / `P1` / `P2` / `P3`)
- Category
- Short Description
- Status (`Fixed`, `Partially Fixed`, `Unresolved`, `Accepted Risk`)
- Release Impact (`Blocking`, `High`, `Medium`, `Low`)

Do not put code in the table.
Keep the table readable and concise.

---

# PART 10 — REQUIRED VALIDATION MATRIX

After auditing and repairing, run the broadest practical validation set the repo supports.

At minimum, attempt the appropriate subset of:

## Root / Monorepo

- `pnpm install`
- `pnpm lint`
- `pnpm format:check`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm check`
- `pnpm ci`

## Targeted Workspace Commands

Use the repo’s actual scripts/package names where present, such as:

- `pnpm --filter api lint`
- `pnpm --filter api typecheck`
- `pnpm --filter api test`
- `pnpm --filter api build`
- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web test`
- `pnpm --filter web build`
- `pnpm --filter ui test`
- `pnpm --filter db build`

## Docker Validation

If practical:

- `docker compose -f infra/docker/docker-compose.devremote.yml config`
- `docker compose -f infra/docker/docker-compose.prod.yml config`
- targeted `docker build` commands if useful

## Terraform Validation

If practical:

- `terraform fmt -check`
- `terraform validate`

## E2E / Playwright

If configured and practical:

- relevant Playwright or E2E validation commands

You must attempt to fix actionable failures you expose.

---

# PART 11 — AUTONOMOUS REPAIR LOOP

Use this loop:

1. inspect repo
2. identify findings
3. classify findings by severity
4. repair what is safely actionable
5. run validation
6. fix newly exposed or remaining actionable issues
7. rerun validation
8. repeat until:
   - the repo reaches the best coherent validated state possible, or
   - real blockers remain

Do not stop after the first pass if more actionable repairs remain.

---

# PART 12 — REQUIRED QUALITY CONFIRMATION DECISION

At the end of the audit, make one of the following decisions:

- **GO**
- **GO WITH RISKS**
- **NO-GO**

Decision guidance:

## GO

Use only if:

- no unresolved P0 findings remain
- P1 findings are either minimal or low-risk in context
- validation is broadly healthy
- environment and release assumptions are coherent
- frontend is sufficiently readable/accessibility-safe/responsive on major paths

## GO WITH RISKS

Use if:

- no unresolved P0 findings remain
- some P1 findings remain but are understood and explicitly acceptable
- validation is mostly healthy but not perfect
- repo is usable and coherent enough to advance with caution

## NO-GO

Use if:

- any release-blocking P0 findings remain unresolved
- critical validation failures persist without justified external blocker
- environment or deployment assumptions are dangerously inconsistent
- frontend or core product flows are still materially unfit

You must justify the decision clearly.

---

# PART 13 — HARD CONSTRAINTS

## Do Not

- rewrite the entire repo from scratch unless absolutely necessary
- create duplicate systems instead of reconciling existing ones
- silently change required environments or domain assumptions
- claim fixes you did not actually make
- claim validation passed if you did not run it
- hide unblockable issues
- under-classify serious defects

## Must Do

- inspect the repo deeply
- repair what is safely actionable
- classify findings honestly
- produce a findings summary table
- provide category checklists
- provide a release-style decision
- report exact files changed
- report exact commands run

---

# PART 14 — REQUIRED RESPONSE CONTRACT

Because you have filesystem access, your answer must be a **high-value, principal-level quality confirmation report**, not a giant code dump.

Respond using this exact structure:

# FINAL FULL REPO QUALITY CONFIRMATION

## OBJECTIVE

Brief summary of the audit and repair pass.

## REPO INSPECTION SUMMARY

Summarize the repo state before repairs.

## AUDIT COVERAGE

List all categories actually audited.

## SUMMARY TABLE OF FINDINGS

Provide a Markdown table with columns:

- Finding ID
- Severity
- Category
- Short Description
- Status
- Release Impact

## FINDINGS BY SEVERITY

### P0 Findings

### P1 Findings

### P2 Findings

### P3 Findings

If a severity bucket has no findings, explicitly write `None`.

## FIXES APPLIED

Summarize the most important repairs completed.

## FILES CREATED

- exact/path/to/file

## FILES MODIFIED

- exact/path/to/file

## FILES REMOVED

- exact/path/to/file

## COMMANDS RUN

List the exact commands executed.

## VALIDATION RESULTS

Clearly state:

- what passed
- what failed
- what was repaired after validation
- what remains unresolved
- whether the repo is now in the best validated state achievable from the current codebase

## CATEGORY CHECKLISTS

Provide a checklist for each audit category (A through P) showing:

- inspected
- repaired if applicable
- validated if applicable
- residual risk documented

## RELEASE / QUALITY DECISION

Choose one: **GO**, **GO WITH RISKS**, or **NO-GO**

## DECISION RATIONALE

Explain clearly why that decision was made.

## BLOCKERS

List unresolved blockers, or write `None`.

## RESIDUAL RISKS

List important remaining risks, even if non-blocking.

## NEXT RECOMMENDED STEP

State the single best next action after this quality confirmation run.

### Important

Do not dump full file contents unless explicitly requested.  
Actually perform the deep-dive audit and summarize the result in this exact structure.

---

# PART 15 — START NOW

Perform the final full repo deep-dive audit / quality confirmation run now.

Prioritize:

1. P0 integrity / security / deploy / validation blockers
2. P1 correctness / UX / operability / release risks
3. P2 cleanup / hardening / normalization
4. P3 future improvements only after real risks are understood

Focus especially on:

- broken imports and TS/build issues
- hidden cross-phase drift
- environment/domain inconsistency
- docs vs implementation mismatch
- Docker / Terraform / workflow drift
- frontend/backend/database contract drift
- UX inconsistency
- accessibility readiness
- responsive readiness
- release integrity

Then return the final quality confirmation report.
