# Docs, Developer Experience & Operations Audit Summary

**Date:** 2026-06-21
**Scope:** README.md, AGENTS.md, SECURITY.md, root scripts/env config, infra docs, runbooks, contributing docs, CI/tooling config
**Reviewer:** Automated audit tooling

---

## Severity Definitions

| Level  | Impact                                                                |
| ------ | --------------------------------------------------------------------- |
| **P0** | Blocks onboarding, deploy, or incident response entirely              |
| **P1** | High friction for new contributors; missing critical handoff material |
| **P2** | Moderate inconvenience or documentation drift                         |
| **P3** | Polish/hardening — nice to have                                       |

---

## 1. Onboarding Quality

### 1.1 Setup Script Correctness

| File                          | Finding                                                                                                                                                                                                                                                                                                                                    | Severity |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `scripts/setup-dev.sh:42`     | `grep -q "SUPABASE_ANON_KEY=<from"` — after first successful run, the placeholder is already replaced and the sed block is **skipped entirely**, so subsequent runs will NOT update keys even if Supabase regenerated them. The PS1 script uses unconditional regex replace and does not have this bug.                                    | P1       |
| `scripts/setup-dev.sh:43-55`  | macOS (`sed -i ''`) vs Linux (`sed -i`) branch uses `"$OSTYPE" == "darwin"*` — but the `*` glob only works inside `[[ ]]`, not inside `[ ]` with `==`. On macOS, this condition evaluates incorrectly and runs the Linux `sed -i` (no backup extension), which fails with `sed: 1: "...": invalid command code `.`. The script errors out. | P1       |
| `scripts/setup-dev.ps1`       | No prerequisite checks for `node`, `pnpm`, or `docker` (the bash script has these at lines 9-11). On a fresh Windows machine without Docker Desktop, the user gets a cryptic Docker error from `npx supabase start`.                                                                                                                       | P2       |
| `scripts/setup-dev.sh:9-11`   | Checks for `node`, `pnpm`, `docker` but not `git`. A fresh clone might not have git on PATH for hooks.                                                                                                                                                                                                                                     | P3       |
| `scripts/setup-dev.ps1:49-51` | `Get-ChildItem packages/db/sql/migrations/*.sql` sorts alphabetically — `001_`, `002_`... works, but is fragile by convention.                                                                                                                                                                                                             | P3       |

### 1.2 Environment File Confusion

| File                        | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Severity |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `.env.local.example`        | The composite root `.env.local.example` combines both API and Web vars. But `apps/api/.env.example` and `apps/web/.env.example` also exist as standalone docs. Neither of these app-level `.env.example` files is **ever referenced by any script**. A contributor reading `apps/web/.env.example` would think they need a separate `.env.local` in the web directory — but the scripts handle everything from the root `.env.local`. This creates confusion about which env file is canonical. | P1       |
| `apps/api/.env.example:1-2` | Says "Copy this to .env and fill in your values" — but the setup scripts never copy it. If a dev manually follows this instruction, they create `apps/api/.env` which is **not loaded** because the scripts read from root `.env.local`.                                                                                                                                                                                                                                                        | P2       |
| `apps/web/.env.example:1-2` | Says "Copy this to .env.local and fill in your values" — but if a dev copies to `apps/web/.env.local`, the `.gitignore` pattern `.env.*local` will NOT gitignore it since it's in a subdirectory (`.gitignore` patterns are case-sensitive and path-anchored: `.env.*local` matches only at root level).                                                                                                                                                                                        | P2       |

### 1.3 Missing Entry Points

| File                                  | Finding                                                                                                                                                                                                                | Severity |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| (missing) `CONTRIBUTING.md` at root   | No root-level contributing guide. The existing `docs/contributing/` directory is not linked from README. A new contributor has to discover `docs/README.md` first.                                                     | P1       |
| (missing) `.nvmrc` or `.node-version` | `package.json` requires `>=20.0.0` but there's no `.nvmrc` for `nvm use` / `fnm use` auto-switching.                                                                                                                   | P2       |
| (missing) GitHub issue/PR templates   | No `.github/ISSUE_TEMPLATE/`, no `.github/PULL_REQUEST_TEMPLATE.md`. Contributors have no guidance on bug reports, feature requests, or PR structure.                                                                  | P2       |
| (missing) CODEOWNERS                  | No `.github/CODEOWNERS` — no auto-assignment for sensitive paths like `infra/terraform/`, `supabase/migrations/`, `apps/api/src/modules/auth/`.                                                                        | P2       |
| (missing) `.gitattributes`            | No line-ending normalization. `.editorconfig` declares `end_of_line = lf`, but this is only honored if the editor supports it. Git's `text=auto` in `.gitattributes` enforces LF consistently across all contributors. | P2       |

### 1.4 Documentation Coverage

| File                                           | Finding                                                                                                                                                                                                                           | Severity |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `README.md:5`                                  | Briefly references AGENTS.md but does not link to `docs/contributing/`, `docs/architecture/`, or `docs/runbooks/`. A new contributor must discover documentation hierarchy via the `docs/README.md` navigation page.              | P2       |
| `docs/contributing/local-development.md:52-55` | Migration list uses "4-11: remaining migrations + policies" instead of enumerating all 11 files. Lazy reference.                                                                                                                  | P3       |
| `docs/contributing/local-development.md:33-44` | Documents "Without Docker" path but the `pnpm build` step will fail if `SUPABASE_*` keys are missing or wrong. No guidance on what exactly won't work.                                                                            | P2       |
| `tests/README.md`                              | Documents only directory layout and run commands. No info on where tests live (co-located `__tests__/` dirs), how to write new tests, mocking strategy, or test data setup.                                                       | P2       |
| `packages/db/README.md`                        | Documents SQL files and status but says "To apply, run the SQL files in numerical order via the Supabase SQL Editor" — this contradicts the automated migration in `setup-dev.ps1`/`.sh`. Manual-first instruction is misleading. | P2       |

---

## 2. Script & Documentation Completeness

### 2.1 Script Inventory

| Script                     | Purpose                         | Gaps                                                                                |
| -------------------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| `scripts/setup-dev.ps1`    | Full Windows local setup        | No prerequisite checks; fragile .env.local key extraction without error fallback    |
| `scripts/setup-dev.sh`     | Full Mac/Linux local setup      | macOS sed bug; grep condition skips update on re-runs                               |
| `scripts/teardown-dev.ps1` | Stop Supabase + clean artifacts | Cleans `apps/api/dist`, `apps/web/.next`, etc. but not `node_modules` (intentional) |
| `scripts/teardown-dev.sh`  | Stop Supabase + clean artifacts | Same as PS1                                                                         |

**Missing scripts:**
| Script | Severity |
|--------|----------|
| `scripts/update-keys.ps1` / `.sh` — Re-run key extraction from Supabase without full setup (to handle Supabase container restarts) | P2 |
| `scripts/reset-db.ps1` / `.sh` — Reset local Supabase DB to clean state (stop + start + re-run migrations) | P2 |

### 2.2 Documentation Completeness

| Topic                                 | Status                                                                                                                                                                          | Severity |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Changelog / Release Notes**         | Missing entirely — no `CHANGELOG.md` or GitHub Releases workflow                                                                                                                | P1       |
| **API Reference**                     | No OpenAPI/Swagger spec. Route docs only exist in source code comments (if any) and the API audit summary.                                                                      | P1       |
| **Database Migration Runbook**        | Missing — no doc on how to create, version, test, or roll back a migration. The dual-directory issue (`packages/db/sql/migrations/` vs `supabase/migrations/`) is undocumented. | P1       |
| **Monitoring/Observability Guide**    | Missing — Sentry is configured but there's no doc on how to view errors, set up alerts, or interpret Pino logs.                                                                 | P2       |
| **Incident Response / On-Call Guide** | Missing — no runbook for what to do when the site is down, DB is degraded, or a deploy fails                                                                                    | P2       |
| **Secrets Rotation Guide**            | Missing — no doc on rotating Supabase keys, GitHub secrets, or SSH keys                                                                                                         | P2       |
| **Performance benchmarks**            | Missing — no baseline load test results or expected latency figures                                                                                                             | P3       |

### 2.3 infra/docker/README.md — Traefik vs Caddy Drift

| File                           | Finding                                                                                                                                                                                                                                                                                                                                                                     | Severity                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `infra/docker/README.md:1`     | Title says "Docker / Compose / **Traefik**" and all architecture diagrams reference Traefik. But `AGENTS.md:11` and the runbooks (`docs/runbooks/development-deploy-overview.md:49`) reference **Caddy**. The compose files likely reference Traefik or Caddy — but the README documents the wrong proxy. This creates confusion for anyone debugging reverse proxy issues. | **P0** — documented proxy mismatches actual proxy, which could lead operators to check wrong config files during an incident. |
| `infra/docker/README.md:53-56` | Architecture diagram shows "Internet → Traefik (80/443)" — this is wrong if Caddy is the actual proxy.                                                                                                                                                                                                                                                                      | P0                                                                                                                            |
| `infra/docker/README.md:61-62` | References `traefik/traefik.yml` — if Caddy is being used, this directory/file may not exist or may be stale.                                                                                                                                                                                                                                                               | P1                                                                                                                            |

---

## 3. Runbook Readiness

### 3.1 Deploy Runbooks

| Runbook                                        | Assessment                                                                                                 | Severity |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| `docs/runbooks/local-bootstrap-validation.md`  | Good — covers bootstrap, validation commands, E2E setup, troubleshooting                                   | ✅       |
| `docs/runbooks/development-deploy-overview.md` | Good — covers provisioning, post-provision, automated deploy, manual deploy, verification, troubleshooting | ✅       |
| `docs/runbooks/production-deploy-overview.md`  | Good — covers provisioning, automated deploy, rollback, monitoring                                         | ✅       |
| `docs/runbooks/pre-deploy-checklist.md`        | Good — covers Supabase setup, SSH key gen, GitHub secrets, first deploy verification                       | ✅       |

### 3.2 Missing Runbook Material

| Gap                                                                                                                                                                                                                                                      | Severity |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Rollback runbook** — Production deploy doc mentions manual rollback via SSH + docker pull/tag but no automated rollback via GitHub Actions, no database rollback (migration down), and no "how to know when to rollback vs fix forward" decision tree. | P1       |
| **Database migration runbook** — No doc on how to create a new migration, test it locally, apply to staging/prod, and roll back if it fails. The current migration pipeline (manual SQL editor on deploy) is fragile.                                    | P1       |
| **Incident response runbook** — No runbook for: page-down scenario, DB connection loss, OOM crash, certificate expiry, or rate-limit exhaustion. AGENTS.md documents known issues but no playbook.                                                       | P1       |
| **Health check documentation** — The health endpoint exists and returns 503 when degraded, but there's no doc explaining what each health check means or how to interpret a degraded status.                                                             | P2       |
| **Droplet recovery runbook** — No doc on how to recover if the DigitalOcean droplet is lost (provision from Terraform, restore DB from Supabase backup, configure git clone + env).                                                                      | P2       |

### 3.3 CI/CD Pipeline Documentation Gaps

| Gap                                                                                                                                                                                                                                 | Severity |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Deploy workflow references GitHub Environment `development` and `production` secrets, but there's no doc linking the GitHub Environments to the deploy workflows (the `docs/environments/` docs exist but aren't cross-referenced). | P2       |
| No documentation of what each workflow does in plain language beyond the table in AGENTS.md. A new ops person needs to read raw YAML to understand deploy flow.                                                                     | P2       |

---

## 4. Repo Ergonomics

### 4.1 Developer Tooling

| File                          | Assessment                                                                                                            | Severity |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------- |
| `.editorconfig`               | Present, covers charset, indent, trailing whitespace, final newline. Handles `*.md` (no trailing whitespace trim). ✅ | Good     |
| `.prettierrc.json`            | Present, semicolons on, double quotes, trailing commas, 100 width, Tailwind plugin. ✅                                | Good     |
| `eslint.config.mjs`           | Present, flat config, TS strict, Next plugin for web, test file exemptions. ✅                                        | Good     |
| `tsconfig.base.json`          | Present, `strict: true`, ES2022, bundler resolution, source maps. ✅                                                  | Good     |
| `turbo.json`                  | Present, clean pipeline definitions, `dev` cached false + persistent, `test` depends on `build`. ✅                   | Good     |
| `package.json` (lint-staged)  | Present — Prettier runs on `*.{ts,tsx,js,mjs,cjs,json,md}` on commit. ✅                                              | Good     |
| `package.json` (prepare hook) | `"prepare": "husky"` — installs husky hooks on `pnpm install`. ✅                                                     | Good     |
| `.gitignore`                  | Covers node_modules, dist, .next, .turbo, coverage, env files (with example exception). ✅                            | Good     |

### 4.2 Missing Ergonomics

| Item                                                                                                                                                                                                                               | Severity                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **No `.husky/pre-commit` file** — The `lint-staged` config exists in `package.json` but the actual husky hook file (`.husky/pre-commit`) was not found via glob. If it doesn't exist, `lint-staged` never actually runs on commit. | **P1** — if the hook file is missing, the entire pre-commit quality gate is non-functional despite the config existing. |
| **No `.nvmrc`** — No automatic Node version switching.                                                                                                                                                                             | P2                                                                                                                      |
| **No `.gitattributes`** — Git may not normalize line endings across Windows/Linux contributors.                                                                                                                                    | P2                                                                                                                      |

---

## 5. Missing Handoff Material

### 5.1 Critical Gaps

| Item                                     | Description                                                                                                                                            | Severity |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| **Changelog / Release Notes**            | No `CHANGELOG.md` or GitHub Releases automation. Incoming maintainers cannot trace what changed between versions.                                      | P1       |
| **API Reference (OpenAPI)**              | No Swagger/OpenAPI spec. Frontend developers must read source code to understand API contracts.                                                        | P1       |
| **Architecture Decision Records (ADRs)** | No `docs/adr/` directory. Decisions like "why Traefik → Caddy", "why service_role client for creates", "why dual migration directories" are unwritten. | P1       |
| **Incident Response Runbook**            | No documented procedure for: site down, DB degraded, OOM crash, cert expiry, deploy failure.                                                           | P1       |

### 5.2 Moderate Gaps

| Item                                                                                                     | Severity |
| -------------------------------------------------------------------------------------------------------- | -------- |
| **Database migration guide** (creating, testing, applying, rolling back)                                 | P2       |
| **Secrets rotation guide** (GitHub secrets, Supabase keys, SSH keys, Cloudflare tokens)                  | P2       |
| **Monitoring/observability guide** (Sentry, Pino logs, health endpoint)                                  | P2       |
| **Local dev troubleshooting guide** beyond the basic entries in `local-bootstrap-validation.md`          | P2       |
| **Droplet provisioning/teardown guide** (Terraform usage beyond the basic `terraform apply` in runbooks) | P2       |

### 5.3 Low Gaps

| Item                                                                                  | Severity |
| ------------------------------------------------------------------------------------- | -------- |
| **Performance/benchmark docs** (load test results, expected latency)                  | P3       |
| **Theme/CSS architecture docs** (Tailwind conventions, design tokens)                 | P3       |
| **Testing strategy doc** (unit vs integration vs e2e boundaries, mocking conventions) | P3       |

---

## 6. Prioritized Implementation Roadmap

### Phase 1 — Immediate (P0)

| #   | Task                                                 | Files                     | Fix                                                                                                      |
| --- | ---------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | **Fix infra/docker/README.md Traefik → Caddy drift** | `infra/docker/README.md`  | Update all references from Traefik to Caddy; update architecture diagram; correct proxy config file path |
| 2   | **Fix macOS sed bug in setup-dev.sh**                | `scripts/setup-dev.sh:43` | Use `sed -i ''` only on macOS; properly detect OS with `uname` instead of `$OSTYPE` glob pattern         |
| 3   | **Create husky pre-commit hook**                     | `.husky/pre-commit` (new) | Add `npx lint-staged` to trigger Prettier on staged files at commit time                                 |

### Phase 2 — High (P1)

| #   | Task                                         | Files                                            | Fix                                                                                                                                                                                                                            |
| --- | -------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 4   | **Fix bash setup-dev.sh re-run key update**  | `scripts/setup-dev.sh:42`                        | Replace `grep -q "SUPABASE_ANON_KEY=<from"` with unconditional sed replace (matching the PS1 approach)                                                                                                                         |
| 5   | **Create root CONTRIBUTING.md**              | `CONTRIBUTING.md` (new)                          | Link to `docs/contributing/` and `docs/runbooks/`; add PR/commit guidelines                                                                                                                                                    |
| 6   | **Reconcile env file story**                 | `apps/api/.env.example`, `apps/web/.env.example` | Add banner comment: "This file is documentation only. Setup scripts use root `.env.local.example`. See `docs/contributing/local-development.md`." Or remove the app-level examples and consolidate on the root composite file. |
| 7   | **Create CHANGELOG.md**                      | `CHANGELOG.md` (new)                             | Document version history; link to GitHub Releases                                                                                                                                                                              |
| 8   | **Create incident response runbook**         | `docs/runbooks/incident-response.md` (new)       | Add playbooks for: page-down, DB outage, OOM crash, deploy failure, cert expiry                                                                                                                                                |
| 9   | **Create database migration runbook**        | `docs/runbooks/database-migrations.md` (new)     | Document how to create, test, apply, and roll back migrations; document the dual-directory issue                                                                                                                               |
| 10  | **Add prerequisite checks to setup-dev.ps1** | `scripts/setup-dev.ps1`                          | Add `node`, `pnpm`, `docker` version/availability checks (matching the bash script)                                                                                                                                            |

### Phase 3 — Medium (P2)

| #   | Task                                      | Files                                                               | Fix                                                                                               |
| --- | ----------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 11  | **Create .nvmrc**                         | `.nvmrc` (new)                                                      | Add `20` for Node 20                                                                              |
| 12  | **Create .gitattributes**                 | `.gitattributes` (new)                                              | Add `* text=auto eol=lf` for cross-platform line-ending normalization                             |
| 13  | **Add PR and issue templates**            | `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/` (new) | Standard templates for bugs, features, PRs                                                        |
| 14  | **Add CODEOWNERS**                        | `.github/CODEOWNERS` (new)                                          | Assign reviewers for sensitive paths                                                              |
| 15  | **Create scripts/update-keys.sh/.ps1**    | `scripts/update-keys.ps1` (new), `scripts/update-keys.sh` (new)     | Re-extract Supabase keys without full setup                                                       |
| 16  | **Create scripts/reset-db.sh/.ps1**       | `scripts/reset-db.ps1` (new), `scripts/reset-db.sh` (new)           | Reset local Supabase DB: stop, start, re-run migrations                                           |
| 17  | **Create API reference docs**             | `docs/api/` (new) or Swagger/OpenAPI spec                           | Document all routes, request/response shapes, auth requirements                                   |
| 18  | **Cross-link README to docs/**            | `README.md`                                                         | Add a "Documentation" section linking to `docs/README.md`, `docs/contributing/`, `docs/runbooks/` |
| 19  | **Create monitoring/observability guide** | `docs/runbooks/monitoring.md` (new)                                 | Document Sentry, Pino logs, health endpoint, docker stats                                         |
| 20  | **Add SECURITY.md link to README**        | `README.md`                                                         | Reference `SECURITY.md` for vulnerability reporting                                               |
| 21  | **Improve tests/README.md**               | `tests/README.md`                                                   | Document test location conventions, mocking strategy, how to add new tests                        |

### Phase 4 — Low (P3)

| #   | Task                                   | Files                                           | Fix                                                           |
| --- | -------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| 22  | Clean up lazy documentation references | `docs/contributing/local-development.md:52-55`  | Enumerate all 11 migration files instead of "4-11: remaining" |
| 23  | Add performance benchmarks             | `docs/benchmarks/` (new)                        | Load test results, expected latencies                         |
| 24  | Add testing strategy doc               | `docs/contributing/testing-strategy.md` (new)   | Unit vs integration vs E2E boundaries                         |
| 25  | Add git check to setup scripts         | `scripts/setup-dev.sh`, `scripts/setup-dev.ps1` | Verify git is installed for husky hooks                       |
| 26  | Create seeds/ documentation            | `packages/db/README.md`                         | Document seed data usage if it exists                         |

---

## Summary Count

| Category             | P0    | P1     | P2     | P3    |
| -------------------- | ----- | ------ | ------ | ----- |
| Setup Scripts        | 0     | 2      | 1      | 1     |
| Env File Confusion   | 0     | 1      | 2      | 0     |
| Missing Entry Points | 0     | 1      | 3      | 1     |
| Doc Coverage         | 0     | 0      | 4      | 1     |
| Script Completeness  | 0     | 0      | 2      | 0     |
| Doc Completeness     | 0     | 3      | 2      | 1     |
| infra/docker Drift   | **2** | 1      | 0      | 0     |
| Runbook Gaps         | 0     | 4      | 2      | 0     |
| CI/CD Doc Gaps       | 0     | 0      | 2      | 0     |
| Repo Ergonomics      | 0     | 1      | 2      | 0     |
| Handoff Gaps         | 0     | 3      | 4      | 3     |
| **Total**            | **2** | **16** | **24** | **6** |

---

## Appendix A: File Reference Map

| Concern           | File(s)                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Setup scripts     | `scripts/setup-dev.ps1`, `scripts/setup-dev.sh`, `scripts/teardown-dev.ps1`, `scripts/teardown-dev.sh`                                          |
| Env templates     | `.env.local.example`, `apps/api/.env.example`, `apps/web/.env.example`, `infra/docker/.env.devremote.example`, `infra/docker/.env.prod.example` |
| Docker/infra docs | `infra/docker/README.md`, `infra/docker/docker-compose.devremote.yml`, `infra/docker/docker-compose.prod.yml`                                   |
| Runbooks          | `docs/runbooks/*.md` (4 files)                                                                                                                  |
| Contributing docs | `docs/contributing/*.md` (3 files)                                                                                                              |
| Architecture docs | `docs/architecture/*.md` (3 files)                                                                                                              |
| Environment docs  | `docs/environments/*.md` (2 files)                                                                                                              |
| Tooling config    | `.editorconfig`, `.prettierrc.json`, `eslint.config.mjs`, `tsconfig.base.json`, `turbo.json`, `.gitignore`                                      |
| CI/CD             | `.github/workflows/*.yml` (5 files)                                                                                                             |
