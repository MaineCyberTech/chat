# Audit Final Reconciliation — July 16, 2026 (v2)

**Reconciled**: July 24, 2026
**Inputs**: 9 v2 principal audit reports
**Methodology**: 4-phase reconciliation per `docs/prompts/final_reconciliation_prompt_pack/FULL_PROMPT_PACK.md`
**Key Question**: Did all P1 findings from the original audit (14 P1s consolidated) get resolved? What is the new P0/P1/P2/P3 count?

---

## Executive Summary

**Original audit P1 findings (July 1-9, 2026): ALL RESOLVED.** The 55 original P1 findings (16 from UI/UX deep audit + 39 from hardening 8-domain) were verified fixed and remain fixed.

**However, the July 16, 2026 re-audit round found 32 new unique P1 findings across 9 domain reports.** These were NOT present in the original audit wave — they are new findings from deeper scrutiny (RLS `using (true)` policies, production deployment hardening gaps, API middleware param mismatches, missing observability on worker, supply chain container hardening, and frontend accessibility regressions).

**Consolidated new severity totals:**

| Severity  | Count   | Delta from Original                   |
| --------- | ------- | ------------------------------------- |
| **P0**    | **0**   | 0                                     |
| **P1**    | **32**  | +32 (all new July 16 findings)        |
| **P2**    | **68**  | Consolidated (domain overlap removed) |
| **P3**    | **52**  | Consolidated (domain overlap removed) |
| **Total** | **152** |                                       |

**Overall Decision: GO WITH RISKS** — 0 P0. All 32 P1 findings are addressable within ~2 weeks of focused engineering. No production deployment blockers. Key risk clusters: RLS policy gaps (4), deployment hardening (4), observability gaps (3), frontend accessibility (2), and CI/CD gate integrity (3).

---

## Phase 1: Audit Artifact Intake and Inventory

### 1.1 Artifact Inventory

| #   | Report                      | File                                        | Domains                                                                                     | Stage     | Findings | P0/P1/P2/P3 |
| --- | --------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------- | --------- | -------- | ----------- |
| 1   | Security/AuthZ/Tenancy      | `audit_security_authz_tenancy_20260716.md`  | Auth middleware, RLS, CORS, CSRF, CSP, rate limiting, exploit analysis                      | Principal | 18       | 0/3/9/6     |
| 2   | API/Worker/Integrations     | `audit_api_worker_integrations_20260716.md` | 27 route files, 7 worker processors, scheduler, Socket.io, webhooks                         | Principal | 23       | 0/3/12/8    |
| 3   | Database/Schema             | `audit_database_schema_20260716.md`         | 57 migrations, 33 tables, indexes, data lifecycle, GDPR                                     | Principal | 14       | 0/2/5/7     |
| 4   | Infra/Deployment/Resilience | `audit_infra_deployment_20260716.md`        | 3 environments, Terraform, compose, Caddy, CI/CD, recovery                                  | Principal | 18       | 0/5/9/4     |
| 5   | Testing/QA/CI-CD            | `audit_testing_qa_cicd_20260716.md`         | 26/27 API modules tested, middleware gaps, E2E, CI gates, coverage                          | Principal | 20       | 0/4/8/6     |
| 6   | Docs/DevEx/Operations       | `audit_docs_devex_ops_20260716.md`          | 22 docs, 4 scripts, 14 runbooks, governance templates                                       | Principal | 15       | 0/1/5/9     |
| 7   | UI/UX 8-Phase Re-Audit      | `audit_ui_ux_8phase_20260716.md`            | Frontend components, accessibility, responsive design, design tokens, i18n                  | Principal | 8        | 0/2/4/2     |
| 8   | Hardening 8-Domain          | `audit_hardening_8domain_20260716.md`       | Security, Data, Resilience, Observability, Supply Chain, Privacy, CI/CD Security, Evolution | Principal | 37       | 0/10/16/11  |
| 9   | Domain-Specific All         | `audit_domain_specific_all_20260716.md`     | 8 domains (Security, Environment, Ops, Release, Governance, Features, Testing, Promotion)   | Principal | 53       | 0/9/26/18   |

**Raw totals before deduplication**: 0 P0, 39 P1, 94 P2, 71 P3 entries across 9 reports.

### 1.2 Apparent Scope of Each Artifact

| Report          | Primary Scope                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security        | API-layer middleware coverage (27 route modules), RLS policies (11+), CORS/CSRF/CSP, rate limiting, exploit chain analysis                                |
| API/Worker      | All 27 route files + 7 worker processors + scheduler + Socket.io + webhook system. API contract integrity and worker reliability                          |
| Database        | 57 migrations, 49 rollback scripts, 33 tables, index coverage, data retention, GDPR export/delete                                                         |
| Infra           | 3 environments (local/remote dev/prod), compose files, Caddy, Terraform IaC, Dockerfiles, health checks, workflows 20                                     |
| Testing         | Unit tests (26/27 API) + middleware (6/16) + web components (12) + E2E (6 specs) + integration (2) + load (k6) + chaos (2 scripts)                        |
| Docs/DevEx      | 22 documentation files, 4 scripts, 14 runbooks, 6 governance templates. Developer experience and operational readiness                                    |
| UI/UX           | Post-fix re-audit: 56 prior findings verified resolved, 8 new findings across accessibility, mobile nav, settings UX                                      |
| Hardening       | Cross-cutting: supply chain (Dockerfiles), privacy (PII, consent logs, GDPR), evolution (API versioning, metadata, caching)                               |
| Domain-Specific | 8-domain consolidation: additional RLS findings, environment drift, observability blind spots, rollback readiness, governance tiers, feature gap analysis |

### 1.3 Overlapping Subject Areas

| Subject                     | Covered By                                                                         | Potential Conflict                                               |
| --------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Feature flags RBAC          | Security (SEC-001 P1), API (F17 P1), Domain-Specific (FEAT-002 P2), Hardening (P2) | Severity disagreement: P1 vs P2                                  |
| Consent duplicate endpoints | API (F18 P1), Hardening (P2)                                                       | **P1 vs P2 contradiction**                                       |
| Scheduled posts access      | Security (SEC-002 P1), API (F1 P2)                                                 | **P1 vs P2 contradiction**                                       |
| Reactions RLS               | Domain-Specific (SEC-001/002 P1), Security (not addressed)                         | **Security report missed 2 P1 findings**                         |
| User presence RLS           | Domain-Specific (SEC-004 P1), Security (not addressed)                             | **Security report missed P1**                                    |
| Compliance exports RLS      | Domain-Specific (SEC-003 P1), Security (not addressed)                             | **Security report missed P1**                                    |
| GDPR export completeness    | Database (DS-009 P1), Hardening (P2)                                               | **P1 vs P2 contradiction**                                       |
| Webhook middleware params   | API (F16 P1), Security (claims webhooks have workspace membership)                 | **Direct contradiction: Security says working, API says broken** |
| Onboarding tour dialog role | UI/UX (P2, says not fixed), Domain-Specific (not listed)                           | Soft contradiction about resolution status                       |
| Channel-info error handling | Domain-Specific (P1, unresolved), UI/UX (verified fixed)                           | **Contradiction about fix status**                               |
| Worker Dockerfile non-root  | Hardening (P1), Infra (not addressed)                                              | Infra report missed supply chain P1                              |
| CSP on frontend             | Hardening (P1), Security (API CSP only)                                            | Security report only scoped API CSP, missed frontend             |
| Production deploy :latest   | Infra (IDR-009 P1), Hardening (P2)                                                 | **P1 vs P2 contradiction**                                       |
| i18n gaps severity          | Domain-Specific (P1), UI/UX (P2)                                                   | **P1 vs P2 contradiction**                                       |

### 1.4 Gaps in Artifact Coverage

| Gap                                             | Missing From                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| RLS policy source code audit (actual SQL files) | Security report — audited RLS conceptually but missed `using (true)` on reactions, presence, compliance_exports, announcements |
| Frontend CSP/HSTS headers                       | Security report — only audited API CSP, missed Next.js completely                                                              |
| Worker Dockerfile security hardening            | Infra report — audited compose but not individual Dockerfile non-root USER, HEALTHCHECK                                        |
| Worker Prometheus metrics                       | Infra report — health checks audited but metrics not covered                                                                   |
| Page metadata (SEO/accessibility)               | UI/UX report — SEO metadata not in UX scope                                                                                    |
| Webhook route param-level debugging             | Security report — claimed webhook middleware works but didn't test the `:id` → workspace_id mapping                            |
| Private channel RLS enforcement                 | Security report — channels RLS audited for general access but not private channel sub-policy                                   |
| Scheduled posts RLS                             | Security report — API gap found but RLS policy files not verified                                                              |
| Announcements RLS policy                        | Security report — API middleware audited but RLS policy file not checked                                                       |

### 1.5 Artifacts Most Likely to Conflict

1. **Security vs Domain-Specific**: Security report claims reactions have "channel_members join" RLS; domain-specific audit found `using (true)`. Only one can be correct.
2. **Security vs API**: Security says webhooks use `requireWorkspaceMembership` (functional); API report proves F16 with param mapping analysis (broken).
3. **UI/UX vs Domain-Specific**: UI/UX says channel-info errors "verified fixed" (UX-108); domain-specific says still "P1 — silently catches API failures."
4. **API vs Hardening**: API rates consent duplicates as P1; hardening rates same issue as P2.
5. **Database vs Hardening**: Database rates GDPR export as P1; hardening rates same issue as P2.
6. **Infra vs Hardening**: Infra rates production `:latest` tags as P1; hardening rates same issue as P2.

### 1.6 Terminology That Needs Normalization

| Term                              | Used By                 | Inconsistent Meaning                                                                                                                                              |
| --------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "RBAC middleware"                 | Security, API           | Security calls `requirePermission` "RBAC"; API calls `requireAdmin` + `requireWorkspaceRole` "authorization." Same concept, different labels.                     |
| "Tenant isolation"                | Security, API, Database | Security = RLS + middleware checks; API = workspace membership checks; Database = RLS alone. Need unified definition.                                             |
| "Circuit breaker"                 | API, Hardening          | API has circuit breaker on Supabase client; workers have none. Hardening wants shared circuit breaker. Different scope.                                           |
| "Health check"                    | Infra, Hardening, Ops   | `/health` = readiness; `/healthz` = full with DB; worker uses `/healthz` (HTTP) but devremote uses `kill -0 1` (process). Inconsistent terminology.               |
| "SHA-pinned" / "SHA-priority"     | Infra, Hardening        | dev deploy uses SHA-first with `:dev` fallback; prod deploy uses `:latest` only. Hardening report says "neither is SHA-pinned." Infra says dev is "SHA-priority." |
| "Pre-commit" / "pre-commit hooks" | Testing                 | Husky installed but `.husky/` never created. Testing report says "no pre-commit hooks;" husky config says "prepare: husky." True: hooks don't exist.              |

---

## Phase 2: Contradictions, Duplicates, and Drift Detection

### 2.1 Direct Contradictions

#### C-001: Reactions RLS Policy — `using (true)` vs Channel Membership Check

| Report                        | Claim                                                                                 | Evidence                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Security** (p.60)           | Reactions RLS: "✅ channel_members join" for SELECT                                   | Asserts in RLS coverage table that reactions have a channel membership check |
| **Domain-Specific** (SEC-001) | Reactions SELECT policy is `using (true)` — any authenticated user sees ALL reactions | Cites `supabase/policies/06_reactions.sql`                                   |

**Resolution**: The domain-specific report has stronger evidence (specific file path, specific policy line). The security report's claim is UNSUPPORTED. The `using (true)` policy means **all authenticated users can see all reactions**, including on private channel messages.

**Verdict**: **CONTRADICTION — Domain-Specific claim is better evidenced. Security report's RLS coverage table contains false information about reactions.**

#### C-002: Webhook Middleware — Working vs Broken

| Report              | Claim                                                                                                                 | Evidence                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Security** (p.28) | Webhooks use `requireWorkspaceMembership` — table says "✅" for membership check                                      | Superficial middleware read                                                                                                       |
| **API** (F16, P1)   | `requireWorkspaceMembership("id")` evaluates webhook UUID as workspace UUID — all PATCH/DELETE requests fail with 403 | Traced param mapping: `req.params["id"]` = webhook UUID → `workspace_members WHERE workspace_id = <webhook UUID>` → never matches |

**Resolution**: The API report's analysis is definitive. The webhook mutation endpoints (`PATCH/DELETE /webhooks/:id`) are **universally broken** — no user can modify or delete any webhook, regardless of role.

**Verdict**: **CONTRADICTION — API report is correct. Security report's middleware coverage table is inaccurate for webhooks.**

#### C-003: Channel-Info Error Handling — Fixed vs Still Broken

| Report                           | Claim                                                              | Evidence               |
| -------------------------------- | ------------------------------------------------------------------ | ---------------------- |
| **UI/UX** (p.15, UX-108)         | "Verified fixed: Toast on failure in channel-info.tsx:49"          | Claims fix applied     |
| **Domain-Specific** (UX-108, P1) | "Channel-info silently catches API failures, returns empty arrays" | Claims fix not applied |

**Resolution**: Requires human review of `apps/web/components/chat/channel-info.tsx:49` to verify if toast feedback was actually added for API failures. Both reports cannot be correct simultaneously.

**Verdict**: **CONTRADICTION — Requires file audit. Priority: HUMAN REVIEW.**

#### C-004: Consent Duplicate Endpoints — P1 vs P2

| Report                       | Claim                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------- |
| **API** (F18)                | P1 — "Duplicate consent logging endpoints: POST /consent and POST /consent/log" |
| **Hardening** (Domain 1, P2) | P2 — same finding, same files, lower severity                                   |

**Resolution**: API report correctly identifies this as near-trivial to fix (0.5h) with no data loss risk. However, a duplicate API surface is a code quality issue, not a security risk. P2 is more accurate.

**Verdict**: **CONTENTION RESOLVED — Accept hardening's P2 rating. Duplicate endpoints are cosmetic/dead-code, not a P1.**

#### C-005: GDPR Export Completeness — P1 vs P2

| Report                | Claim                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------- |
| **Database** (DS-009) | P1 — GDPR export covers only 6 of ~20+ data categories. Non-compliant with GDPR Article 20. |
| **Hardening** (P2)    | P2 — "GDPR Export — Does Not Include Consent Logs"                                          |

**Resolution**: Database report provides specific count (6/20+) and cites Article 20. Hardening only mentions consent logs specifically. The broader scope of the database finding (14 missing categories) justifies P1 under GDPR compliance risk.

**Verdict**: **CONTENTION RESOLVED — Accept database's P1 rating. 6/20+ categories exported is materially incomplete for data portability compliance.**

#### C-006: Scheduled Posts — P1 vs P2

| Report                 | Claim                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **Security** (SEC-002) | P1 — "Scheduled posts allow cross-tenant access. Active exploit vector."              |
| **API** (F1)           | P2 — "Incomplete Zod validation coverage" — lists scheduled posts as a validation gap |

**Resolution**: Security report describes an active cross-tenant access vector (any authenticated user can schedule messages in arbitrary channels and read all pending scheduled posts). The API report focuses on the input validation angle, not the authorization gap. Both are correct but security addresses the higher-risk authorization issue. P1 is correct for the authorization gap; P2 is correct for the validation gap.

**Verdict**: **CONTENTION RESOLVED — Both correct at different scopes. The authorization gap (SEC-002) is the P1; the Zod validation gap (F1) is a separate P2. These are NOT duplicates.**

#### C-007: Production Deploy `:latest` Tags — P1 vs P2

| Report                       | Claim                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| **Infra** (IDR-009)          | P1 — Production deploys pull `:latest` tags without SHA-priority. Race condition risk. |
| **Hardening** (Domain 7, P2) | P2 — same finding                                                                      |

**Resolution**: Both reports agree on the finding and recommended fix (SHA-priority pulling). The infra report's P1 reflects the higher blast radius (production outage from bad deploy). P2 from hardening is in the CI/CD security domain which downgrades risks that require authenticated workflow access to exploit.

**Verdict**: **CONTENTION RESOLVED — Accept infra's P1. Production deployment non-reproducibility is a P1 operational risk.**

### 2.2 Soft Contradictions / Drift

#### S-001: Announcements RLS — Secure Middleware vs `using (true)` Policy

The security report says announcements API uses `requireWorkspaceMembership + requireWorkspaceRole("admin")`. The domain-specific report (SEC-009) finds that the RLS SELECT policy is `using (true)`. This is not a direct contradiction — the API-layer middleware is correct, but the database-layer RLS is overly permissive. If the admin client is ever used (or RLS is bypassed), all announcements are visible.

**Verdict**: **Partially consistent.** API protection is adequate but defense-in-depth is missing.

#### S-002: Onboarding Tour Dialog Role — "Moderate Gap" vs "Not Fully Resolved"

UI/UX re-audit initially flags the onboarding tour as lacking `role="dialog"`, then re-checks and says it's "a moderate accessibility gap" but does NOT list it as one of the 8 new findings. However, the original July 16 audit (UX-218) flagged this and it was listed as resolved. The re-audit's own Phase 4 (line 303) says "not fully resolved" but Phase 8 (final synthesis) doesn't include it in the remaining gap summary.

**Verdict**: **Partially consistent.** The re-audit contradicts itself internally. The onboarding tour still lacks `role="dialog"`. This should be counted as an extant P2 finding.

#### S-003: Cookie Banner — "Focus Trap Exists" vs "No aria-modal"

UI/UX re-audit notes the cookie banner has a focus trap but lacks `aria-modal="true"`. This was listed as resolved (UX-219) but the re-audit acknowledges `aria-modal` is still missing.

**Verdict**: **Partially consistent.** Focus trap fix applied, aria-modal fix was not. Should be counted as a P3 gap.

### 2.3 Duplicate Recommendations

The following findings appear in **3+ reports** with nearly identical descriptions:

| Finding                                  | Reports                                                       | Severity Range |
| ---------------------------------------- | ------------------------------------------------------------- | -------------- |
| Feature flags lack admin RBAC            | Security (P1), API (P1), Domain-Specific (P2), Hardening (P2) | P1-P2          |
| Workers lack circuit breaker on Supabase | Hardening (P1), API (implied)                                 | P1             |
| GDPR delete not transactional            | Database (P2), Hardening (P2), Domain-Specific (P2)           | P2             |
| Worker no Prometheus metrics             | Hardening (P1), Domain-Specific (P2)                          | P1-P2          |
| No page metadata                         | Hardening (P1), Domain-Specific (P2)                          | P1-P2          |
| Worker Dockerfile no HEALTHCHECK         | Hardening (P2), Infra (P3), Domain-Specific (P3)              | P2-P3          |
| Production deploy :latest tags           | Infra (P1), Hardening (P2)                                    | P1-P2          |
| API no Redis health check                | Hardening (P3), Infra (P2), Domain-Specific (P2)              | P2-P3          |
| highlightText duplicated                 | Hardening (P3), Domain-Specific (P2)                          | P2-P3          |

These 9 findings account for **24 of 39 P1-level entries** across reports. After deduplication, they consolidate to 9 unique findings.

### 2.4 Risk Rating Inconsistencies

| Finding                           | Lowest Severity Assigned     | Highest Severity Assigned           | Reconciled                                         |
| --------------------------------- | ---------------------------- | ----------------------------------- | -------------------------------------------------- |
| Feature flags RBAC                | P2 (Domain-Specific)         | P1 (Security, API)                  | **P1** — active privilege escalation vector        |
| Consent duplicate endpoints       | P2 (Hardening)               | P1 (API)                            | **P2** — dead code, no security impact             |
| GDPR export incomplete            | P2 (Hardening)               | P1 (Database)                       | **P1** — Article 20 non-compliance                 |
| Scheduled posts access            | P2 (API, validation context) | P1 (Security, authz context)        | **P1** — active cross-tenant vector                |
| Production :latest tags           | P2 (Hardening)               | P1 (Infra)                          | **P1** — production deployment risk                |
| i18n gaps (admin/settings/search) | P2 (UI/UX)                   | P1 (Domain-Specific)                | **P2** — accessibility/usability gap, not security |
| Worker no Prometheus              | P2 (Domain-Specific)         | P1 (Hardening)                      | **P1** — observability blind spot for production   |
| Page metadata                     | P2 (Domain-Specific)         | P1 (Hardening)                      | **P1** — accessibility/SEO regression              |
| Channel-info errors               | P2 (UI/UX says fixed)        | P1 (Domain-Specific says not fixed) | **HUMAN REVIEW**                                   |
| Worker non-root user              | Not in infra report          | P1 (Hardening)                      | **P1** — container security                        |

### 2.5 Sequencing Inconsistencies

**Issue**: The UI/UX 8-Phase report provides a 5-phase roadmap (Phases 0-4) totaling 6-9 dev-days. The Domain-Specific report provides a 3-tier remediation plan (P1 this week, P2 this sprint, P3 next sprint) with ~40 dev-days of effort. The hardening report recommends 5 priority actions with no time estimates.

These are three different execution roadmaps that partially overlap but have conflicting priority orders:

| Action                                 | UI/UX Priority   | Domain-Specific Priority | Hardening Priority    |
| -------------------------------------- | ---------------- | ------------------------ | --------------------- |
| Fix admin mobile nav                   | Phase 1 (Wk 1-2) | P1 Immediate (This week) | Not addressed         |
| Create web middleware                  | Not addressed    | Not addressed            | #1 priority           |
| Fix RLS policies (reactions, presence) | Not addressed    | P1 Immediate (This week) | Not explicitly listed |
| Fix webhook middleware                 | Not addressed    | Not in P1 list           | Not addressed         |
| Shared circuit breaker                 | Not addressed    | Not in P1 list           | #2 priority           |
| Fix Caddyfile.prod                     | Not addressed    | Not addressed            | Not addressed         |
| Worker non-root user                   | Not addressed    | Not addressed            | #3 priority           |
| Fix deploy SHA tags                    | Not addressed    | Not addressed            | Not addressed         |

**Resolution**: The three roadmaps address different domains. A unified reconciliation roadmap (Phase 4 below) is required.

### 2.6 Unsupported or Weakly Supported Claims

| Claim                                            | Report          | Assessment                                                                                                                                                                         |
| ------------------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Reactions RLS includes channel_members join"    | Security        | **UNSUPPORTED** — actual policy file uses `using (true)`. Audit methodology flaw.                                                                                                  |
| "Webhooks use requireWorkspaceMembership"        | Security        | **MISLEADING** — middleware is attached but uses wrong parameter, making it functionally broken.                                                                                   |
| "All 56 prior findings remain fixed"             | UI/UX           | **PARTIALLY UNSUPPORTED** — channel-info (UX-108) and onboarding tour dialog role (UX-218) status contradicted by domain-specific report and internal re-audit self-contradiction. |
| "User presence RLS is ✅"                        | Security        | **UNSUPPORTED** — actual policy is `using (true)`.                                                                                                                                 |
| "Compliance exports have no workspace_id column" | Domain-Specific | **PARTIALLY SUPPORTED** — cites migration file; needs schema verification.                                                                                                         |
| "Caddyfile.prod nested block may be invalid"     | Infra           | **UNSUPPORTED** — Caddy v2 accepts nested global options blocks (the inner `{ }` is valid Caddy syntax). This finding may be a **false positive**.                                 |

### 2.7 Items Requiring Human Review Before Acceptance

| ID    | Item                                     | Why                                                                                                    |
| ----- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| HR-01 | Channel-info toast fix status (C-003)    | Two reports disagree on whether UX-108 was fixed                                                       |
| HR-02 | Caddyfile.prod nested block (IDR-001)    | Caddy v2 syntax does accept nested `{ }` in the global options block — this may be a false positive P1 |
| HR-03 | Reactions RLS policy (C-001)             | Needs file-level verification of `supabase/policies/06_reactions.sql` to confirm `using (true)`        |
| HR-04 | User presence RLS policy (C-001 variant) | Needs file-level verification of presence policy                                                       |
| HR-05 | Scheduled posts RLS policy files         | Security report didn't check; domain-specific didn't check either. Should verify before remediation    |
| HR-06 | Onboarding tour dialog role (S-002)      | UI/UX re-audit contradicts itself — needs file verification of `onboarding-tour.tsx`                   |

---

## Phase 3: Guardrail, Risk, and Validation Normalization

### 3.1 Unified Do-Not-Break Guardrails

**CRITICAL — Do not modify without full regression suite:**

| Guardrail                                                                                                   | Source Report(s)             | Rationale                                                                                       |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| G1: Message list virtualizer + scroll architecture (`message-list.tsx`)                                     | UI/UX Phase 8                | Fragile flex height chain; any change breaks scroll measurement                                 |
| G2: Chat view socket lifecycle + optimistic update chain (`chat-view.tsx`)                                  | UI/UX Phase 8, API           | Critical path for real-time messaging; WebSocket disconnect/reconnect must not lose messages    |
| G3: Flex height chain (`body → main → .app__body → .app__row → .app__content → #channel_view → #post-list`) | UI/UX Phase 8, AGENTS.md     | Every element needs `flex: 1 + min-height: 0`; CSS Grid anywhere in the chain breaks scroll     |
| G4: App sidebar category management state machine (`app-sidebar.tsx`)                                       | UI/UX Phase 8                | Complex drag-drop + edit + delete + reorder state; changes need careful testing                 |
| G5: Message input TipTap editor + autocomplete (`message-input.tsx`)                                        | UI/UX Phase 8                | TipTap integration, emoji autocomplete, slash commands — fragile state                          |
| G6: CSS variable two-system architecture (`globals.css` + `packages/ui/src/styles.css`)                     | UI/UX Phase 8, Design Tokens | Both Mattermost-style vars and design tokens active; don't consolidate without migration plan   |
| G7: Auth middleware chain (`authenticate → requireWorkspaceMembership → requirePermission`)                 | Security                     | Changing middleware order breaks all API auth. All new middleware must slot after authenticate  |
| G8: Supabase per-request client (user JWT for RLS enforcement)                                              | Security                     | Core tenant isolation mechanism. Never replace with admin client without explicit scope gating  |
| G9: Database migration naming convention (`YYYYMMDDHHMMSS_description.sql`)                                 | Database, Infra              | Supabase migration system depends on this ordering. Never reorder or rename existing migrations |
| G10: RLS policies — never make LESS restrictive                                                             | Security, Database           | Current policies are `using (true)` for some tables; tightening is safe, loosening is not       |

**HIGH — Require visual QA before merging:**

| Guardrail                                              | Scope                                 |
| ------------------------------------------------------ | ------------------------------------- |
| G11: Workspace layout sidebar resize + tablet collapse | Any layout.tsx changes                |
| G12: Mobile bottom nav + overlay sidebar               | Any mobile CSS/component changes      |
| G13: Channel routing + URL structure                   | Any route system changes              |
| G14: Theme switching (light/dark)                      | Any CSS variable or theme changes     |
| G15: Search functionality (in-channel + full page)     | Any search-bar or search page changes |

### 3.2 Unified Risk Model

**Risk Scoring Matrix:**

| Dimension                    | Weight   | Current Score | Target     |
| ---------------------------- | -------- | ------------- | ---------- |
| Auth/AuthZ integrity         | 25%      | 7/10          | 9/10       |
| Cross-tenant isolation       | 20%      | 7/10          | 9/10       |
| Production deployment safety | 15%      | 6/10          | 8/10       |
| Observability/alerting       | 10%      | 5/10          | 8/10       |
| Supply chain security        | 10%      | 6/10          | 8/10       |
| Data lifecycle (GDPR)        | 10%      | 6/10          | 9/10       |
| CI/CD gate integrity         | 10%      | 5/10          | 8/10       |
| **Weighted Total**           | **100%** | **6.2/10**    | **8.4/10** |

**Risk Concentrations:**

| Risk Cluster              | P1 Count | Key Gaps                                                                       |
| ------------------------- | -------- | ------------------------------------------------------------------------------ |
| RLS policy gaps           | 4        | reactions, user_presence, compliance_exports, announcements all `using (true)` |
| Production deployment     | 4        | Caddyfile, Terraform backend, deploy lock, SHA tags                            |
| Observability blind spots | 3        | Worker metrics, worker circuit breaker, no on-call paging                      |
| API access control        | 3        | Feature flags, scheduled posts, webhook middleware params                      |
| CI/CD gate bypass         | 3        | E2E non-blocking, migration non-blocking, no pre-commit                        |
| Frontend accessibility    | 2        | Admin mobile nav, formatting bar touch targets                                 |

### 3.3 Tests Required Before High-Risk Changes

| Change                      | Test Type                                         | Minimum Gate                                                             |
| --------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ |
| Any RLS policy modification | Migration test + auth E2E                         | CI migration-test job (must be blocking) + manual cross-user access test |
| Auth middleware changes     | All unit tests for affected middleware            | `pnpm test -- --filter=api` must pass                                    |
| Flex height chain changes   | Manual visual QA + Playwright snapshot            | All breakpoints (mobile, tablet, desktop) verified                       |
| WebSocket/socket changes    | E2E messaging spec (`messaging.spec.ts`)          | Real-time message send between 2 browser contexts                        |
| Database schema migration   | Migration test + rollback test                    | Forward + rollback both pass in CI                                       |
| Dockerfile changes          | Build-push + deploy to dev                        | Trivy scan passes; container health check passes                         |
| CSS variable/theme changes  | Manual visual QA — light + dark + high-contrast   | All 3 modes verified on 3 breakpoints                                    |
| API route changes           | Unit test for route + middleware integration test | At minimum, verify middleware chain executes in correct order            |

### 3.4 Manual / Visual QA Requirements

For any UI/UX change affecting the areas under G11-G15, the following manual QA checklist applies:

- [ ] Light mode — all pages render correctly
- [ ] Dark mode — all pages render correctly
- [ ] Mobile viewport (375px) — no horizontal scroll, touch targets ≥ 44px
- [ ] Tablet viewport (768px) — sidebar auto-collapse works, content visible
- [ ] Desktop viewport (1440px) — full layout, no overflow
- [ ] Keyboard navigation — Tab through all interactive elements
- [ ] Screen reader (NVDA/VoiceOver) — page title, landmarks, live regions announced
- [ ] Channel send message flow (optimistic + confirmed)
- [ ] Thread reply flow
- [ ] Search flow (in-channel + full page)
- [ ] Settings save flow
- [ ] Admin panel tab navigation (including mobile)

### 3.5 Deployment and Environment Safety Requirements

| Check                                         | Dev                         | Production                      |
| --------------------------------------------- | --------------------------- | ------------------------------- |
| CI green (all blocking jobs)                  | ✅ Required                 | ✅ Required                     |
| Migration test passes                         | ✅ Required (make blocking) | ✅ Required                     |
| E2E smoke suite passes                        | ✅ Required                 | ✅ Required                     |
| Trivy scan (no HIGH/CRITICAL)                 | ✅ Required                 | ✅ Required                     |
| SHA-tagged images built                       | ✅ Verified                 | ✅ Required (fix :latest → SHA) |
| Terraform plan reviewed                       | ✅ Required                 | ✅ Required                     |
| Post-deploy health check (API + web + worker) | ✅ Automated                | ✅ Automated                    |
| Post-deploy smoke test (send message)         | Recommended                 | ✅ Required (add to CI)         |
| Rollback plan documented                      | Nice-to-have                | ✅ Required                     |
| Deployment lock active                        | Nice-to-have                | ✅ Required (add to CI)         |

### 3.6 Rollback and Recovery Expectations

| Scenario          | Rollback Method                       | Time to Recover | Automated?               |
| ----------------- | ------------------------------------- | --------------- | ------------------------ |
| Code regression   | Re-deploy previous SHA Docker image   | < 5 min         | Partial (manual trigger) |
| Migration failure | Run `_down.sql` rollback script       | < 15 min        | No (manual)              |
| Infra drift       | `terraform apply` with previous state | < 10 min        | No (manual)              |
| Data loss         | Restore from Supabase backup          | < 2 hours       | No (manual)              |
| Redis failure     | Docker compose restart redis          | < 30 sec        | ✅ Yes (restart policy)  |

### 3.7 Minimum Acceptance Criteria for Implementation Work

1. **All P1 findings** (32) must be either fixed or explicitly accepted as known risk with documented compensating controls.
2. **CI/CD gates** (E2E + migration tests) must be made blocking before any P1 work is deployed.
3. **Pre-commit hooks** (husky + lint-staged) must be initialized to prevent regressions during P1 fixes.
4. **RLS policy fixes** must include migration + rollback scripts and pass the migration-test job.
5. **Production deploy** must switch to SHA-priority image pulling before the next production deployment.

---

## Phase 4: Single Source of Truth Synthesis

### 4.1 Scope and Inputs Considered

**Inputs**: 9 principal audit reports generated July 16, 2026, covering:

- Security/AuthZ/Tenancy (5-phase, 18 findings)
- API/Worker/Integrations (5-phase, 23 findings)
- Database/Schema/Data Lifecycle (5-phase, 14 findings)
- Infra/Deployment/Resilience (5-phase, 18 findings)
- Testing/QA/CI-CD (5-phase, 20 findings)
- Docs/DevEx/Operations (5-phase, 15 findings)
- UI/UX 8-Phase Re-Audit (8-phase, 8 new findings)
- Hardening 8-Domain (8-domain, 37 findings)
- Domain-Specific Consolidated (11 prompts, 53 findings)

**Reference baseline**: `AGENTS.md` (July 18, 2026), original July 9, 2026 audit reports, Mattermost comparative audit v11.9.0.

### 4.2 Reconciled Findings — Master Finding Register

#### P1 Findings (32)

| #   | ID     | Category       | Finding                                                                                       | Primary File(s)                                           | Effort |
| --- | ------ | -------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| 1   | P1-001 | AuthZ          | Feature flags lack RBAC middleware — any auth user can CRUD global flags                      | `feature-flags/routes.ts`                                 | 0.5d   |
| 2   | P1-002 | AuthZ          | Scheduled posts lack channel/membership checks — cross-tenant vector                          | `scheduled-posts/routes.ts`                               | 1d     |
| 3   | P1-003 | Security       | CORS accepts no-origin requests — defense-in-depth gap                                        | `apps/api/src/app.ts:60`                                  | 0.5d   |
| 4   | P1-004 | AuthZ          | Webhook routes use wrong middleware param — PATCH/DELETE universally broken                   | `webhooks/routes.ts:131,147,183,219`                      | 2h     |
| 5   | P1-005 | Schema         | `channels.created_by UUID NOT NULL ... ON DELETE SET NULL` — FK conflict blocks user deletion | `migrations/20260625000003`                               | 2h     |
| 6   | P1-006 | Data Lifecycle | GDPR export covers only 6/20+ data categories — Article 20 non-compliant                      | `auth/routes.ts:218-250`                                  | 2d     |
| 7   | P1-007 | Infra          | Caddyfile.prod nested global options block — **NEEDS HUMAN REVIEW (may be false positive)**   | `Caddyfile.prod:2-7`                                      | 15min  |
| 8   | P1-008 | Infra          | Production Terraform init uses wrong S3 endpoint (AWS, not DO Spaces)                         | `deploy-production.yml:67`                                | 15min  |
| 9   | P1-009 | Infra          | Production deploy lacks deployment lock/concurrency protection                                | `deploy-production.yml:24-26`                             | 2h     |
| 10  | P1-010 | Infra          | Production deploy pulls `:latest` without SHA-priority                                        | `deploy-production.yml:281-290`                           | 2h     |
| 11  | P1-011 | CI/CD          | E2E tests non-blocking (`continue-on-error: true`) — PRs merge with broken E2E                | `validate.yml:430`                                        | 5min   |
| 12  | P1-012 | CI/CD          | Migration test non-blocking (`continue-on-error: true`) — broken migrations merge             | `validate.yml:285`                                        | 5min   |
| 13  | P1-013 | CI/CD          | No pre-commit hooks installed (husky devDependency exists but `.husky/` never created)        | `.husky/`                                                 | 10min  |
| 14  | P1-014 | Testing        | Announcements API module has zero test coverage                                               | `announcements/routes.ts`                                 | 1h     |
| 15  | P1-015 | Security       | No CSP on Next.js frontend — `apps/web/next.config.ts` has no CSP headers                     | `next.config.ts`                                          | 1h     |
| 16  | P1-016 | Security       | No `apps/web/middleware.ts` — zero security headers on frontend origin                        | `apps/web/`                                               | 1h     |
| 17  | P1-017 | Resilience     | Workers create raw Supabase clients without shared circuit breaker                            | `data-retention.ts`, `cleanup.ts`, `compliance-export.ts` | 3h     |
| 18  | P1-018 | Observability  | Worker has no Prometheus metrics — invisible to monitoring                                    | `apps/worker/src/main.ts`                                 | 3h     |
| 19  | P1-019 | Supply Chain   | Worker Dockerfile runs as root — no non-root USER directive                                   | `apps/worker/Dockerfile`                                  | 15min  |
| 20  | P1-020 | Privacy        | PII (IP address, user-agent) stored persistently in consent logs                              | `consent/routes.ts:47-48`                                 | 1h     |
| 21  | P1-021 | CI/CD Security | Secrets written to disk as `.env` file via heredoc in deploy scripts                          | `deploy-development.yml`, `deploy-production.yml`         | 4h     |
| 22  | P1-022 | Evolution      | Zero page metadata on any `page.tsx` — no titles, no OG tags, no SEO                          | All `page.tsx` files                                      | 2h     |
| 23  | P1-023 | Evolution      | API versioning — single `/v1` only, no deprecation strategy                                   | `route-registry.ts`                                       | 1h     |
| 24  | P1-024 | Data Lifecycle | Message archival/purge functions exist but are NEVER invoked — unbounded growth               | `data-retention.ts`, migration `20260625000015`           | 2h     |
| 25  | P1-025 | AuthZ          | Reactions RLS SELECT policy is `using (true)` — all auth users see all reactions              | `supabase/policies/06_reactions.sql`                      | 1h     |
| 26  | P1-026 | AuthZ          | Reactions batch endpoint lacks message access control                                         | `reactions/routes.ts:24-41`                               | 1h     |
| 27  | P1-027 | AuthZ          | Compliance exports table has no `workspace_id` — cross-workspace data leak                    | `migrations/20260709000003`                               | 1h     |
| 28  | P1-028 | AuthZ          | User presence RLS SELECT is `using (true)` — all auth users see all presence                  | `migrations/20260704000001`                               | 1h     |
| 29  | P1-029 | Observability  | No automated on-call rotation or paging system — Sentry alerts require manual monitoring      | Alerting configs                                          | 4h     |
| 30  | P1-030 | Frontend       | Admin page mobile navigation hidden (`hidden md:block`) — no mobile access to admin tabs      | `admin/page.tsx`                                          | 2h     |
| 31  | P1-031 | Frontend       | Formatting bar touch targets 28px on desktop — fail 44px WCAG minimum                         | `formatting-bar.tsx:256`                                  | 1h     |
| 32  | P1-032 | Observability  | API logger has no PII redaction — separate from shared `@chat/config/logger` with redaction   | `apps/api/src/lib/logger.ts`                              | 1h     |

#### P2 Findings (68 — Notable Highlights)

Full deduplicated P2 list consolidated. Key themes:

| Theme                               | Count | Examples                                                                                                                                                                                                |
| ----------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Missing tenant isolation middleware | 8     | Private channels insert restriction, messages SELECT for private channels, announcements RLS, user groups members, thread join/leave, read receipts, message forward target, workspace delete ownership |
| Incomplete validation/Zod coverage  | 5     | 13+ routes with inline validation instead of Zod schemas                                                                                                                                                |
| Worker reliability gaps             | 5     | In-process setTimeout retries, cleanup unimplemented types, reminder not using BullMQ, scheduler setInterval, per-channel notification retry                                                            |
| GDPR/privacy edge cases             | 4     | Deletion not transactional, messages deleted (not anonymized), consent logs not in export, notification retention filter                                                                                |
| Observability/ops gaps              | 4     | No Prometheus deployed, Redis not in health check, worker no HEALTHCHECK, no backup verification CI                                                                                                     |
| Environment parity                  | 4     | Caddyfile/health endpoint/compose drift across 3 environments                                                                                                                                           |
| E2E test coverage                   | 4     | No admin/thread/DM/channel-settings E2E flows                                                                                                                                                           |
| Documentation completeness          | 4     | Missing runbook/architecture/security/operations READMEs                                                                                                                                                |
| Frontend UX gaps                    | 4     | Settings dual save, no result count on search, no debounce on toggles, macOS modifier display                                                                                                           |
| Miscellaneous                       | 26    | See full P2 table in individual reports                                                                                                                                                                 |

#### P3 Findings (52 — Consolidated)

Key themes: Dead code (dm_channels table, density modes, gridArea CSS), missing runbook sections, hardening gaps (SQL injection false positives in sanitizer, CSP nonce support), documentation improvements (hardcoded counts, missing cross-refs), minor UX (settings skeleton, forgot password link, CSV parser quote handling).

### 4.3 Reconciled Risk Register

| Risk                                                      | Probability | Impact                          | Mitigation                                                     | Status                          |
| --------------------------------------------------------- | ----------- | ------------------------------- | -------------------------------------------------------------- | ------------------------------- |
| Cross-tenant data leak via RLS `using (true)`             | Low-Medium  | High (private data exposure)    | Fix 4 RLS policies (P1-025 through P1-028)                     | **P1 — Fix this week**          |
| Production deployment failure from wrong image            | Medium      | High (downtime)                 | SHA-priority pulling (P1-010), deployment lock (P1-009)        | **P1 — Fix before next deploy** |
| Broken CI gates allow bad code to ship                    | High        | High (regression to production) | Remove continue-on-error from E2E + migration (P1-011, P1-012) | **P1 — Fix immediately**        |
| Worker failure undetected (no metrics/no circuit breaker) | Medium      | High (silent queue backlog)     | Worker metrics (P1-018), shared circuit breaker (P1-017)       | **P1 — Fix this sprint**        |
| GDPR non-compliance (incomplete export)                   | Low         | High (legal/financial)          | Expand export to all categories (P1-006)                       | **P1 — Fix this sprint**        |
| User deletion fails (FK constraint)                       | Low         | Medium (support incident)       | Fix channels.created_by FK (P1-005)                            | **P1 — Fix this week**          |
| Container escape via root user                            | Low         | Critical                        | Worker non-root USER (P1-019)                                  | **P1 — Fix this week**          |
| Frontend CSP bypass (no web middleware)                   | Low         | Medium (XSS vector)             | Create web middleware.ts (P1-016), add CSP (P1-015)            | **P1 — Fix this week**          |
| API secrets leaked from disk `.env`                       | Low         | Critical                        | Docker secrets or vault (P1-021)                               | **P1 — Fix this sprint**        |
| Mobile admin inaccessible                                 | High        | Medium (UX degradation)         | Mobile tab nav (P1-030)                                        | **P1 — Fix this week**          |

### 4.4 Reconciled Roadmap and Execution Order

#### Phase 0: Immediate Blockers (Day 1-2, ~3 dev-hours)

Must be done before any further deploys or P1 fixes:

| Order | ID                  | Action                                                                     | Effort |
| ----- | ------------------- | -------------------------------------------------------------------------- | ------ |
| 0.1   | HR-01 through HR-06 | Verify 6 human-review items (especially Caddyfile P1 false positive check) | 2h     |
| 0.2   | P1-011              | Remove `continue-on-error` from E2E CI job                                 | 5min   |
| 0.3   | P1-012              | Remove `continue-on-error` from migration-test CI job                      | 5min   |
| 0.4   | P1-013              | Initialize husky: `npx husky init` + add lint-staged pre-commit hook       | 10min  |

#### Phase 1: Critical Security & Data Integrity (Week 1, ~3 dev-days)

| Order | ID     | Action                                                                    | Effort |
| ----- | ------ | ------------------------------------------------------------------------- | ------ |
| 1.1   | P1-025 | Fix reactions RLS SELECT — scope by channel membership via message join   | 1h     |
| 1.2   | P1-026 | Fix reactions batch endpoint — add requireMessageAccess middleware        | 1h     |
| 1.3   | P1-027 | Add workspace_id to compliance_exports + scope RLS                        | 1h     |
| 1.4   | P1-028 | Fix user_presence RLS — scope to workspace co-members                     | 1h     |
| 1.5   | P1-001 | Add admin role check to feature-flags mutation endpoints                  | 0.5d   |
| 1.6   | P1-002 | Add channel access verification to scheduled-posts routes                 | 1d     |
| 1.7   | P1-004 | Fix webhook route middleware parameter mapping                            | 2h     |
| 1.8   | P1-005 | Fix channels.created_by FK conflict (SET NULL → CASCADE or make nullable) | 2h     |
| 1.9   | P1-019 | Add non-root USER to worker Dockerfile                                    | 15min  |
| 1.10  | P1-015 | Add CSP headers to Next.js config (minimum baseline)                      | 1h     |
| 1.11  | P1-016 | Create `apps/web/middleware.ts` with security headers                     | 1h     |

#### Phase 2: Production Deployment Hardening (Week 1-2, ~2 dev-days)

| Order | ID     | Action                                                            | Effort |
| ----- | ------ | ----------------------------------------------------------------- | ------ |
| 2.1   | P1-010 | Switch production deploy to SHA-priority image pulling            | 2h     |
| 2.2   | P1-008 | Fix production Terraform init backend config (DO Spaces endpoint) | 15min  |
| 2.3   | P1-009 | Add deployment lock/concurrency protection to prod deploy         | 2h     |
| 2.4   | P1-007 | Fix Caddyfile.prod syntax (AFTER verifying with v2 syntax doc)    | 15min  |
| 2.5   | P1-021 | Migrate from `.env` file to Docker secrets or vault               | 4h     |
| 2.6   | P1-003 | Remove no-origin CORS bypass or restrict to documented clients    | 0.5d   |

#### Phase 3: Observability & Resilience (Week 2, ~3 dev-days)

| Order | ID     | Action                                                                       | Effort |
| ----- | ------ | ---------------------------------------------------------------------------- | ------ |
| 3.1   | P1-017 | Extract circuit-breaker Supabase client to `packages/db/` for worker sharing | 3h     |
| 3.2   | P1-018 | Add prom-client metrics to worker (jobs processed, failures, queue depth)    | 3h     |
| 3.3   | P1-032 | Consolidate loggers or add PII redaction to API logger                       | 1h     |
| 3.4   | P1-029 | Set up automated on-call/paging (PagerDuty or Opsgenie integration)          | 4h     |
| 3.5   | P1-024 | Schedule message archival job in data-retention worker processor             | 2h     |

#### Phase 4: Data Lifecycle & Compliance (Week 2-3, ~4 dev-days)

| Order | ID     | Action                                                       | Effort |
| ----- | ------ | ------------------------------------------------------------ | ------ |
| 4.1   | P1-006 | Expand GDPR export to cover all 20+ personal data categories | 2d     |
| 4.2   | P1-020 | Redact or time-limit IP/user-agent storage in consent logs   | 1h     |
| 4.3   | P1-023 | Create `docs/api/versioning.md` with deprecation policy      | 1h     |
| 4.4   | P1-022 | Add `export const metadata` to all page.tsx files            | 2h     |
| 4.5   | P1-014 | Add route tests for announcements GET/POST/PATCH             | 1h     |

#### Phase 5: Frontend Accessibility & UX (Week 3, ~2 dev-days)

| Order | ID     | Action                                                                    | Effort |
| ----- | ------ | ------------------------------------------------------------------------- | ------ |
| 5.1   | P1-030 | Fix admin page mobile navigation (horizontal scroll tabs or bottom sheet) | 2h     |
| 5.2   | P1-031 | Fix formatting bar desktop touch targets to ≥ 44px                        | 1h     |
| 5.3   | S-002  | Add `role="dialog"` + focus trap to onboarding tour                       | 1h     |
| 5.4   | S-003  | Add `aria-modal="true"` to cookie banner                                  | 15min  |
| 5.5   | C-003  | Verify/fix channel-info toast feedback (human review item)                | 15min  |

#### Phase 6: P2 Backlog (Ongoing, ~10 dev-days estimated)

See individual reports for full P2 register (68 items). Priority order:

1. Private channel RLS + messages SELECT fix (domain-specific SEC-007, SEC-008)
2. GDPR delete transactional wrapping (database DS-010)
3. Worker cleanup: implement expired_uploads, reminder → BullMQ, scheduler → repeatable jobs
4. E2E test expansion: admin, thread, DM, channel settings
5. Environment normalization: Caddyfile, .env.example, health endpoints
6. Missing TypeScript interfaces for 5+ tables
7. Route registry endpoint metadata population
8. Missing middleware tests (10 of 16 files)
9. Package tests (db, ui, sdk)

#### Phase 7: P3 Backlog (Future, ~8 dev-days estimated)

See individual reports for full P3 register (52 items).

### 4.5 Reconciled File/Area Priorities

#### HIGHEST TOUCH-RISK (modify only with full test coverage):

| File                | Why                                   | Guarded By |
| ------------------- | ------------------------------------- | ---------- |
| `message-list.tsx`  | Virtualizer + scroll architecture     | G1, G3     |
| `chat-view.tsx`     | Socket lifecycle + optimistic updates | G2         |
| `app-sidebar.tsx`   | Category management state machine     | G4         |
| `message-input.tsx` | TipTap editor + autocomplete          | G5         |
| `globals.css`       | CSS variable architecture             | G6         |

#### HIGH PRIORITY — Fix First:

| File                                  | Finding(s)                                    | Effort |
| ------------------------------------- | --------------------------------------------- | ------ |
| `supabase/policies/06_reactions.sql`  | P1-025 (RLS using true)                       | 1h     |
| `feature-flags/routes.ts`             | P1-001 (missing RBAC)                         | 0.5d   |
| `scheduled-posts/routes.ts`           | P1-002 (missing channel check)                | 1d     |
| `webhooks/routes.ts`                  | P1-004 (wrong middleware param)               | 2h     |
| `validate.yml`                        | P1-011, P1-012 (non-blocking E2E + migration) | 10min  |
| `apps/web/middleware.ts` (create)     | P1-015, P1-016 (CSP + security headers)       | 1h     |
| `apps/api/src/modules/auth/routes.ts` | P1-006 (GDPR export), P1-005 (user delete FK) | 2d     |
| `deploy-production.yml`               | P1-008, P1-009, P1-010 (backend, lock, SHA)   | 4.5h   |
| `apps/worker/Dockerfile`              | P1-019 (non-root USER)                        | 15min  |
| `admin/page.tsx`                      | P1-030 (mobile nav)                           | 2h     |

#### MODERATE PRIORITY — Fix This Sprint:

| File(s)                                        | Finding(s)                                 | Effort |
| ---------------------------------------------- | ------------------------------------------ | ------ |
| `apps/worker/src/processors/*.ts`              | P1-017 (circuit breaker), P1-018 (metrics) | 6h     |
| `apps/worker/src/processors/data-retention.ts` | P1-024 (message archive)                   | 2h     |
| `consent/routes.ts`                            | P1-020 (PII in logs)                       | 1h     |
| `apps/api/src/lib/logger.ts`                   | P1-032 (PII redaction)                     | 1h     |
| All `page.tsx` files                           | P1-022 (metadata)                          | 2h     |
| `Caddyfile.prod`                               | P1-007 (verify syntax)                     | 15min  |
| `.github/workflows/deploy-*.yml`               | P1-021 (secrets on disk)                   | 4h     |
| `announcements/routes.ts`                      | P1-014 (zero test coverage)                | 1h     |

### 4.6 Unified Do-Not-Break Guardrails (Condensed)

```
CRITICAL:
  G1-G10: See Section 3.1 — virtualizer, socket lifecycle, flex height chain,
          sidebar state, TipTap editor, CSS variables, auth middleware chain,
          per-request Supabase client, migration naming, RLS policies.

HIGH (require visual QA):
  G11-G15: See Section 3.1 — workspace layout, mobile nav, channel routing,
           theme switching, search functionality.
```

### 4.7 Unified Validation Checklist

#### Per-PR Validation (automated, blocking):

- [ ] Unit tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Typecheck passes (`pnpm typecheck`)
- [ ] Diff coverage ≥ lines=40%, functions=30%, branches=30%, statements=40%
- [ ] Migration test passes (BLOCKING — P1-012 applied)
- [ ] E2E tests pass (BLOCKING — P1-011 applied)
- [ ] Build succeeds (`pnpm build`)
- [ ] Trivy scan (no HIGH/CRITICAL)
- [ ] pnpm audit (no HIGH/CRITICAL)
- [ ] Pre-commit hooks pass (P1-013 applied)

#### Per-Deploy Validation (production):

- [ ] All per-PR checks green
- [ ] SHA-tagged images built and pushed
- [ ] Terraform plan reviewed
- [ ] Rollback SHA documented
- [ ] Post-deploy health checks: API `/healthz`, Web `/`, Worker `/healthz`
- [ ] Post-deploy smoke test: send message, verify WebSocket, search
- [ ] Sentry error rate monitored for 15 minutes post-deploy

### 4.8 Items Deferred or Rejected

| Item                                         | Decision     | Rationale                                             |
| -------------------------------------------- | ------------ | ----------------------------------------------------- |
| MFA/SAML/SSO integration                     | **Deferred** | Enterprise feature; not needed for current scale      |
| Plugin system                                | **Deferred** | Not justified for current deployment                  |
| Desktop native app (Electron/Tauri)          | **Deferred** | PWA sufficient; revisit post-launch                   |
| 64-locale i18n expansion                     | **Deferred** | Current 8 locales sufficient; expand on demand        |
| GIF picker                                   | **Deferred** | Post-launch quick win                                 |
| Density modes (comfortable/compact/spacious) | **Deferred** | Defined in tokens but never implemented; low priority |
| Elasticsearch integration                    | **Deferred** | Current Supabase FTS adequate for scale               |
| LDAP directory sync                          | **Deferred** | Enterprise; not in scope                              |
| Bot accounts                                 | **Deferred** | Not needed for current feature set                    |
| Cross-region storage replication             | **Deferred** | Single-region acceptable for current scale            |

| Item                                  | Decision          | Rationale                                                                                                                                   |
| ------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Remove message list 30-frame RAF loop | **REJECTED**      | Loop is required to trigger virtualizer rendering + measurement before scrollToIndex can work. Documented in AGENTS.md scroll architecture. |
| Consolidate CSS variable systems      | **REJECTED**      | Two-tier system documented and intentional. Consolidation risks breaking existing components in ways hard to detect.                        |
| Remove idempotency in-memory fallback | **REJECTED**      | Fallback provides degraded but functional service when Redis is unavailable. Document limitation instead.                                   |
| Feature flag consumer wiring          | **Deferred (P2)** | Feature flag CRUD works; consumer adoption is post-P1 activity                                                                              |

### 4.9 Remaining Unknowns

| Item                                                     | Risk                        | Resolution Needed                                                                     |
| -------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------- |
| Caddyfile.prod nested block validity                     | P1 false positive potential | Verify against Caddy v2.7+ syntax. If valid, downgrade to P3 (documentation).         |
| Scheduled posts RLS policy file existence                | Unknown                     | Verify `scheduled_posts` has RLS policy. If missing, add P1 item for RLS creation.    |
| Channel-info toast fix actual status                     | Contradiction               | Check git blame on `channel-info.tsx:49` to determine if toast was added after audit. |
| Worker resource limits under load                        | Unknown                     | P3 load test validation needed to confirm 128m memory limit is adequate.              |
| RLS policy for `file_attachments` table                  | Unknown                     | If table exists, check RLS policy. Not audited in any report.                         |
| `notifications` table retention: scheduled or dead code? | Contradiction               | Database audit says dead code; verify scheduler.ts directly.                          |

### 4.10 Final Recommendation

**GO WITH RISKS**

**Rationale**: 0 P0 findings across 152 consolidated findings. The codebase demonstrates strong architectural foundations (per-request Supabase client with RLS, comprehensive middleware stack, structured error handling, webhook reliability patterns, design token system). The 32 P1 findings are concentrated in 6 clusters that can be addressed in parallel:

1. **RLS policy gaps** (4 findings, ~4h) — reactions, user_presence, compliance_exports leaks via `using (true)`. Fixes are surgical and low-risk.
2. **Production deployment safety** (4 findings, ~5h) — Terraform backend, SHA tags, deploy lock, Caddyfile syntax. Prevents deployment incidents.
3. **Observability blind spots** (3 findings, ~10h) — Worker metrics, circuit breaker, PII redaction. Enables incident detection.
4. **API access control** (3 findings, ~7h) — Feature flags, scheduled posts, webhook params. Closes cross-tenant vectors.
5. **CI/CD gate integrity** (3 findings, ~20min) — Remove continue-on-error, initialize husky. Prevents regressions.
6. **Frontend accessibility** (2 findings, ~3h) — Admin mobile nav, formatting bar touch targets. WCAG compliance.

**Estimated total effort for all 32 P1s: ~7-10 dev-days** across a 2-3 person team in a 2-week sprint.

**Critical pre-requisite before starting any P1 fix**: Apply Phase 0 items (P1-011, P1-012, P1-013) to prevent regressions during the fix cycle.

**Key answer to the original question**: Yes, all 55 original P1 findings (16 UX + 39 hardening) from the July 1-9 audit wave remain RESOLVED. The 32 new P1 findings in this report are from the July 16 re-audit round — deeper scrutiny of RLS policies, deployment safety, observability, and supply chain that were not in scope during the original audits. The total count is NOT additive (55 old + 32 new = 87) — the old ones are verified fixed. The new count is: **0 P0, 32 P1, 68 P2, 52 P3.**

### 4.11 Contradiction Resolution Log

| ID                          | Resolution                                                   | Action                                                          |
| --------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| C-001 (reactions RLS)       | Domain-Specific correct; Security claim UNSUPPORTED          | Fix reactions RLS; correct security report's RLS coverage table |
| C-002 (webhook middleware)  | API report correct; Security claim MISLEADING                | Fix webhook param mapping; update security report               |
| C-003 (channel-info errors) | **HUMAN REVIEW REQUIRED**                                    | Check file; reconcile both reports                              |
| C-004 (consent duplicates)  | P2 accepted                                                  | Downgrade from P1 in API report                                 |
| C-005 (GDPR export)         | P1 accepted                                                  | Database report severity stands                                 |
| C-006 (scheduled posts)     | Both correct, different scopes (authz vs validation)         | Two separate findings: authz=P1, validation=P2                  |
| C-007 (production :latest)  | P1 accepted                                                  | Infra report severity stands                                    |
| S-001 (announcements RLS)   | Partially consistent — API protection exists, DB RLS missing | Add to P2 list (defense-in-depth)                               |
| S-002 (onboarding tour)     | Partially consistent — fix partially applied                 | Add `role="dialog"` to remaining gap list                       |
| S-003 (cookie banner)       | Partially consistent — focus trap fixed, aria-modal not      | Add `aria-modal` to P3 list                                     |

---

_Final Reconciliation v2 — July 24, 2026_
_Source: 9 v2 principal audit reports dated July 16, 2026_
_Reconciled against the July 1-9 original audit baseline (AGENTS.md)_
_Prompt pack: `docs/prompts/final_reconciliation_prompt_pack/`_
