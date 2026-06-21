# Phase 5 — Safe Alignment Roadmap

## 1. Roadmap Summary

This roadmap converts audit findings into a staged engineering plan. The goal is **not** to make the current repo a copy of the reference repo — the domains are different. Instead, the goal is to adopt beneficial **structural patterns** from the reference repo (operational tooling, Supabase maturity, documentation discipline) while preserving the current repo's superior modular architecture, real-time capabilities, and modern toolchain.

**Total estimated effort**: ~3-5 days for Phases 0-2; Phases 3-4 are optional and can be deferred.

---

## 2. Immediate Low-Risk Wins (Phase 1)

| #   | Item                                                    | Pattern Source                    | Effort  | Risk |
| --- | ------------------------------------------------------- | --------------------------------- | ------- | ---- |
| 1.1 | Add `supabase/seeds/` with minimal seed data            | Reference `supabase/seeds/`       | ~30 min | None |
| 1.2 | Extract RLS policies into `supabase/policies/`          | Reference `supabase/policies/`    | ~15 min | None |
| 1.3 | Add `supabase/functions/` directory (empty placeholder) | Reference structure               | ~1 min  | None |
| 1.4 | Create `packages/config/` with shared eslint + tsconfig | Reference `packages/config/`      | ~30 min | Low  |
| 1.5 | Complete `.env.example` files for all env vars          | Reference `.env.example` pattern  | ~15 min | None |
| 1.6 | Add inline JSDoc comments to key API modules            | Reference has none — keep current | ~0 min  | None |

### Phase 1 Verification Gate

- Tests pass (`pnpm test`)
- Typecheck passes (`pnpm typecheck`)
- Lint passes (`pnpm lint`)
- Local dev still works (`pnpm dev`)

---

## 3. Low-Risk Similarity Improvements (Phase 2)

| #   | Item                                                         | Pattern Source                     | Effort  | Risk | Prerequisites                  |
| --- | ------------------------------------------------------------ | ---------------------------------- | ------- | ---- | ------------------------------ |
| 2.1 | Add per-module integration tests for all 5 API modules       | Reference has Jest tests per route | ~2 days | Low  | Phase 1 complete               |
| 2.2 | Add playwright e2e tests for workspace + channel flows       | Reference has e2e.yml              | ~1 day  | Low  | Phase 1 complete               |
| 2.3 | Add `scripts/start-local-stack.ps1` for full local bootstrap | Reference scripts                  | ~1 hr   | Low  | Phase 1.1 (seeds)              |
| 2.4 | Add health check endpoint documentation                      | Reference health.ts                | ~15 min | None | —                              |
| 2.5 | Add security headers middleware (CSP, HSTS, XSS)             | Reference middleware               | ~30 min | Low  | Existing helmet may cover this |

### Phase 2 Verification Gate

- Phase 1 items complete
- All new tests pass
- `pnpm check` passes (format + lint + typecheck + test)
- Manual smoke test of workspace + channel flows

---

## 4. Medium-Risk Convergence Candidates (Phase 3)

| #   | Item                                                         | Pattern Source                    | Effort  | Risk   | Prerequisites                                        |
| --- | ------------------------------------------------------------ | --------------------------------- | ------- | ------ | ---------------------------------------------------- |
| 3.1 | Add `apps/worker/` with BullMQ for async email/notifications | Reference worker                  | ~3 days | Medium | Needs Redis on 512MB droplet (OOM concern)           |
| 3.2 | Add client SDK package `packages/sdk/`                       | Reference SDK                     | ~2 days | Medium | Requires API route stability, API client abstraction |
| 3.3 | Add notification system (email via nodemailer)               | Reference routes/notifications.ts | ~2 days | Medium | Depends on Phase 3.1 (worker)                        |
| 3.4 | Add Supabase edge function placeholder                       | Reference `supabase/functions/`   | ~30 min | Low    | —                                                    |
| 3.5 | Add Terraform remote state backend (S3)                      | Reference uses local state        | ~1 hr   | Medium | Requires AWS account or DO Spaces                    |

### Phase 3 Verification Gate

- Phases 1-2 complete
- Droplet memory monitoring (512MB may OOM with Redis + Worker)
- Load testing before enabling worker in production
- Gradual rollout via feature flags

---

## 5. Optional Strategic Improvements (Phase 4)

| #   | Item                                           | Pattern Source                        | Effort              | Risk   | Notes                                                    |
| --- | ---------------------------------------------- | ------------------------------------- | ------------------- | ------ | -------------------------------------------------------- |
| 4.1 | Upgrade droplet to s-2vcpu-2gb                 | Reference uses same                   | ~15 min (Terraform) | Medium | Prerequisite for Phase 3.1 (worker + Redis)              |
| 4.2 | Add load testing scripts                       | Reference `scripts/load-testing/`     | ~1 day              | Low    | Valuable before public launch                            |
| 4.3 | Add backup automation                          | Reference `scripts/backup-database.*` | ~1 hr               | Low    | Low priority — Supabase has PITR                         |
| 4.4 | Add bundle analyzer for web                    | Reference has none                    | ~30 min             | Low    | Current already has it (ANALYZE=true)                    |
| 4.5 | Fix Let's Encrypt certs (auto-resolves Jun 21) | Reference uses auto ACME              | 0 min               | Medium | Let Encrypt rate limit expires Jun 21 — no action needed |
| 4.6 | Production deploy workflow testing             | Reference deploy-do.yml               | ~1 day              | Medium | `deploy-production.yml` exists but untested              |

### Phase 4 Verification Gate

- All Phases 0-3 complete
- Load testing passes with target metrics
- Droplet upgrade verified
- Production deploy dry-run on staging

---

## 6. What Must Stay As-Is

| Current Implementation                         | Why It Must Stay                                          |
| ---------------------------------------------- | --------------------------------------------------------- |
| Feature-based modules/ API structure           | Cleaner than reference's flat routes/                     |
| Socket.io real-time messaging                  | Superior to reference's raw ws                            |
| Same-domain Caddy routing                      | Simpler than subdomain split                              |
| Vitest test framework                          | Faster than reference's Jest                              |
| Consolidated CI (workflow_call + path filters) | Less duplication than reference's 8 workflows             |
| Docker HEALTHCHECK                             | Reference lacks this                                      |
| Graceful shutdown handlers                     | Reference lacks this                                      |
| Shared UI component library                    | Reference lacks this                                      |
| pnpm@9.15.4                                    | Reference uses pnpm@10 — not worth upgrading until needed |
| tailwindcss v4                                 | Reference uses v3 — not worth downgrading                 |

---

## 7. Recommended Execution Order

```
Phase 0: No changes — audit complete (current status)
    ↓ (all clear)
Phase 1: Immediate low-risk wins (~1 day)
    ├── 1.1 supabase/seeds/
    ├── 1.2 supabase/policies/
    ├── 1.3 supabase/functions/ placeholder
    ├── 1.4 packages/config/
    └── 1.5 .env.example completeness
    ↓ (tests + typecheck + lint + manual smoke)
Phase 2: Low-risk improvements (~3-4 days)
    ├── 2.1 Module integration tests
    ├── 2.2 E2E tests for workspace + channel
    ├── 2.3 Local stack bootstrap script
    └── 2.4-2.5 Health docs + security headers review
    ↓ (all tests + pnpm check + smoke test)
Phase 3: Medium-risk convergence (~7-10 days)
    ├── 3.1 Worker app + Redis (if droplet RAM allows)
    ├── 3.2 SDK package
    ├── 3.3 Notification system (depends on worker)
    └── 3.4-3.5 Terraform state + edge functions
    ↓ (load testing + gradual rollout + monitoring)
Phase 4: Optional strategic (~2-3 days)
    ├── 4.1 Droplet upgrade
    ├── 4.2 Load testing
    ├── 4.3 Backup automation
    └── 4.6 Production deploy testing
```

---

## 8. Minimum Validation Gate Before Each Phase

| Gate               | Checks Required                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Before Phase 1** | `pnpm test` passes, `pnpm typecheck` passes, `pnpm lint` passes, `pnpm dev` starts without errors                |
| **Before Phase 2** | Phase 1 complete, all new seed data loads correctly in local Supabase, lint covers new files                     |
| **Before Phase 3** | Phases 1-2 complete, droplet memory monitoring shows headroom for Redis + Worker, load test baseline established |
| **Before Phase 4** | Phases 0-3 complete, production monitoring in place, rollback plan documented, staging environment verified      |
