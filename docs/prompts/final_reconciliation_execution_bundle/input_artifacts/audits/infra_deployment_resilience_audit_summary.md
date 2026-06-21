# Infrastructure, Deployment & Resilience Audit Summary

**Date**: 2026-06-21
**Scope**: Terraform, Docker Compose, CI/CD workflows, Dockerfiles, server entrypoint, Caddy config
**Repo**: chat-platform (C:\temp\chat)

---

## TL;DR

4 P0, 9 P1, 5 P2, 5 P3 findings identified. The two critical P0 issues are: (1) the production compose mounts the **dev Caddyfile** which requires TLS certs never provisioned in the prod deploy workflow, and (2) there is **no Terraform remote state backend** — every CI run starts from an empty state file, relying on fragile `terraform import` workarounds. The production deploy workflow is **not ready for use** without fixes.

---

## 1. Environment Separation Correctness

| Finding                                     | Severity | File                                        | Detail                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------- | -------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Production compose mounts dev Caddyfile** | **P0**   | `infra/docker/docker-compose.prod.yml:18`   | Volume mounts `./Caddyfile` (resolves to `infra/docker/Caddyfile`), which expects TLS certs at `/etc/caddy/certs/`. The correct file `Caddyfile.prod` uses `auto_https off` and `http://` origins and does not need certs. Prod deploy never provisions certs → Caddy fails at startup.                  |
| Caddyfile.prod missing API path routes      | P3       | `infra/docker/Caddyfile.prod`               | Routes `chat-api.mainecybertech.com` full proxy. This works because API is on a separate subdomain, but the dev Caddyfile's explicit path routing (`/auth`, `/workspaces`, `/messages`, `/socket.io`) is not replicated — fine for current architecture, but any future same-domain routing would break. |
| Web service missing NODE_ENV in devremote   | P3       | `infra/docker/docker-compose.devremote.yml` | Common env anchor omits `NODE_ENV`; only the API service sets `NODE_ENV: development`. Web runs with default env.                                                                                                                                                                                        |
| Domain validation in Terraform              | OK       | `infra/terraform/variables.tf:11-14`        | Environment restricted to `development` or `production`. Domains correctly split via `locals.tf`.                                                                                                                                                                                                        |
| Image tag separation                        | OK       | Compose files                               | Dev uses `:dev`, prod uses `:latest`. SHA tags also pushed for traceability.                                                                                                                                                                                                                             |

---

## 2. Terraform State Management & Drift Handling

| Finding                                     | Severity | File                                             | Detail                                                                                                                                                                                                                                   |
| ------------------------------------------- | -------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No remote state backend**                 | **P0**   | `infra/terraform/versions.tf`                    | State is stored locally. Every CI run starts fresh — `terraform import` workarounds are fragile and race-prone with concurrent runs. Blocks that exist in DO but not in state are recreated.                                             |
| **SSH from 0.0.0.0/0 on port 22**           | **P1**   | `infra/terraform/main.tf:34-38`                  | Root SSH access open to the world. Should be restricted to CI runner IPs or a bastion.                                                                                                                                                   |
| **No Cloudflare IP restriction**            | **P1**   | `infra/terraform/main.tf:40-49`                  | HTTP/HTTPS inbound from `0.0.0.0/0`. Cloudflare recommends restricting origin server to [Cloudflare IP ranges](https://www.cloudflare.com/ips/) only. Missing this restriction is a contributing factor to the **Cloudflare 521** issue. |
| `ignore_changes = [user_data]` causes drift | P2       | `infra/terraform/main.tf:19`                     | Cloud-init changes (packages, firewall rules via UFW, Docker config) are never applied to existing droplets after initial provision. If `cloud-init.yaml.tftpl` is updated, the droplet will drift.                                      |
| No Terraform monitoring/alerting            | P3       | `infra/terraform/main.tf`                        | `monitoring = true` enables DO metrics but no alerts configured for CPU, memory, or disk.                                                                                                                                                |
| `prevent_destroy` on droplet                | OK       | `infra/terraform/main.tf:18`                     | Protects against accidental deletion.                                                                                                                                                                                                    |
| SSH key management in infra workflow        | OK       | `.github/workflows/infra-development.yml:96-109` | CI public key is registered with DO before apply. Correct approach.                                                                                                                                                                      |

---

## 3. Docker Compose Safety & Resource Constraints

| Finding                                                    | Severity | File                                              | Detail                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | -------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No memory limits on prod containers**                    | **P1**   | `infra/docker/docker-compose.prod.yml`            | 512MB droplet runs 3 containers (Caddy, Next.js, Express) with zero resource constraints. Next.js build alone can OOM. Already flagged as known issue. Dev remote only limits API to 192m.                                                                             |
| **Docker system prune destroys volumes on every deploy**   | **P1**   | `.github/workflows/deploy-development.yml:130`    | `docker system prune -af --volumes` wipes Caddy's persisted cert data and config volumes on every development deploy. Forces full cert re-issuance.                                                                                                                    |
| No health check dependency chain                           | P2       | `infra/docker/docker-compose.devremote.yml:34-36` | Web `depends_on: api: condition: service_started` only ensures the container started, not that the API is healthy. Web starts before API is ready.                                                                                                                     |
| Prod web missing `NEXT_PUBLIC_APP_URL` build-arg alignment | P3       | `infra/docker/docker-compose.prod.yml`            | Web container has no `env_file` — all vars pass via `environment`. This is fine, but the `NEXT_PUBLIC_*` vars must match build-args or be set at runtime. Currently `NEXT_PUBLIC_APP_URL` is set at build-time only (in `build-push.yml` and `deploy-production.yml`). |
| Caddy volumes persist between restarts                     | OK       | Compose files                                     | `caddy-data` and `caddy-config` named volumes persist across restarts (except when pruned — see P1 above).                                                                                                                                                             |

---

## 4. Deploy Repeatability & Rollback Readiness

| Finding                                             | Severity | File                                                                                  | Detail                                                                                                                                                                                                |
| --------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **No rollback strategy in any workflow**            | **P1**   | `.github/workflows/deploy-development.yml`, `.github/workflows/deploy-production.yml` | No mechanism to revert to previous image tags or compose state. SHA-tagged images exist in GHCR but are never referenced for rollback. `docker image prune -af` removes previous SHA-tagged versions. |
| **Git pull on droplet in prod deploy**              | **P1**   | `.github/workflows/deploy-production.yml:186-188`                                     | `git pull origin main` is fragile — dirty working tree or merge conflicts cause silent deploy failure. No `git stash` or force-clean before pull.                                                     |
| Dev deploy pipes images over SSH                    | P2       | `.github/workflows/deploy-development.yml:163-166`                                    | `docker save                                                                                                                                                                                          | gzip | ssh ... docker load`works but is slow (~minutes for multi-GB images). No fallback to`docker pull` on droplet. Single connection failure aborts deploy. |
| Dev deploy external health check exits 0 on failure | P2       | `.github/workflows/deploy-development.yml:219`                                        | Final external health check `exit 0` even when HTTP/HTTPS both fail. Masks DNS/cert provisioning failures — pipeline reports success when services are unreachable.                                   |
| No pinned compose file version on droplet           | P3       | Both deploy workflows                                                                 | Compose file is overwritten every deploy. Previous version not preserved. Rollback requires re-running workflow with commit SHA.                                                                      |

---

## 5. Health Checks, Observability & Sentry

| Finding                                            | Severity | File                                                     | Detail                                                                                                                                                                                                                                         |
| -------------------------------------------------- | -------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docker HEALTHCHECK present on both containers      | OK       | `apps/api/Dockerfile:49-50`, `apps/web/Dockerfile:50-51` | API: 30s interval, 5s timeout, 3 retries. Web: 30s interval, 10s timeout, 40s start period, 3 retries. Reasonable defaults.                                                                                                                    |
| Graceful shutdown with 10s drain                   | OK       | `apps/api/src/server.ts:28-38`                           | SIGTERM/SIGINT handlers close HTTP server with 10s forced-shutdown timeout and `unref()`.                                                                                                                                                      |
| Sentry initialized                                 | OK       | `apps/api/src/server.ts:10`                              | `initSentry()` called before app creation.                                                                                                                                                                                                     |
| Pino structured logger                             | OK       | AGENTS.md                                                | JSON in production, pretty-print in dev.                                                                                                                                                                                                       |
| **No /healthz endpoint exposed in Caddyfile.prod** | **P2**   | `infra/docker/Caddyfile.prod`                            | `Caddyfile` routes `/health*` and `/healthz*` to API. `Caddyfile.prod` only reverse-proxies the full domain. Health checks from Docker rely on direct container access, but external monitoring (e.g., DO monitoring, UptimeRobot) would fail. |
| DB connectivity + latency in health check          | OK       | AGENTS.md                                                | Returns 503 when degraded.                                                                                                                                                                                                                     |

---

## 6. CI/CD Pipeline Reliability

| Finding                                          | Severity | File                                                                           | Detail                                                                                                                                                      |
| ------------------------------------------------ | -------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Node version mismatch in production workflow** | **P1**   | `.github/workflows/deploy-production.yml:24`                                   | Uses `node-version: 20` while all other workflows use Node 22. This invalidates pnpm cache and may produce different build output.                          |
| **No concurrency control on infra workflow**     | **P2**   | `.github/workflows/infra-development.yml`                                      | Two pushes to `infra/**` within minutes cause concurrent Terraform operations against the same state file — guaranteed corruption without remote state.     |
| pnpm cache via setup-node                        | OK       | `.github/workflows/validate.yml:16`                                            | `cache: pnpm` enabled.                                                                                                                                      |
| Docker build cache (type=gha, mode=max)          | OK       | `.github/workflows/build-push.yml:49-50`                                       | GitHub Actions cache with max mode for layer sharing.                                                                                                       |
| Path filters reduce unnecessary runs             | OK       | `.github/workflows/build-push.yml`, `.github/workflows/deploy-development.yml` | Build & deploy workflows only trigger on relevant file changes.                                                                                             |
| Concurrency with cancel-in-progress              | OK       | `build-push.yml`, `deploy-development.yml`                                     | Prevents queue buildup.                                                                                                                                     |
| validate.yml re-installs deps per job            | P3       | `.github/workflows/validate.yml`                                               | `test`, `lint`, `typecheck` each run `pnpm install --frozen-lockfile` independently. Adds ~30s per job. Could merge or use dependency caching between jobs. |

---

## 7. Known Failure Modes

| Failure Mode                                          | Severity | Status                      | Mitigation                                                                                                                                                                                          |
| ----------------------------------------------------- | -------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Let's Encrypt rate-limit** (168h ban until June 21) | **P0**   | Active — expires today      | Workaround: Cloudflare Flexible SSL. Caddyfile.prod uses `auto_https off` to avoid ACME entirely. However, the dev Caddyfile (used by prod — see P0 above) still tries to load TLS certs from disk. |
| **512MB droplet OOM** (3 containers)                  | **P0**   | Active                      | Swap file created in deploy-dev (1GB), but no memory limits on containers. Swap only delays OOM. Upgrade to `s-2vcpu-2gb` recommended. API has `mem_limit: 192m` in dev only.                       |
| **Cloudflare 521** (origin unreachable)               | **P1**   | Active                      | Firewall allows `0.0.0.0/0` on ports 80/443 (main.tf), not restricted to Cloudflare IPs. UFW in cloud-init also open to all. Configure DO firewall to allow only Cloudflare IP ranges.              |
| **Infra workflow creates duplicate droplets**         | **P2**   | Active, workaround in place | Terraform import is unreliable without remote state. Cleanup step deletes extra droplets by name/age. Remote state eliminates this entirely.                                                        |
| **Self-signed certs for dev**                         | P3       | Managed                     | Deploy-dev generates self-signed certs when Cloudflare origin certs not available. Works but generates browser warnings.                                                                            |

---

## 8. Production Deploy Workflow Readiness

**Verdict: NOT READY — 3 blocking issues found.**

| Issue                                       | Severity | Detail                                                                                                                                                                                                                                                             |
| ------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Compose mounts wrong Caddyfile**          | **P0**   | `docker-compose.prod.yml:18` mounts `./Caddyfile` (dev, expects TLS certs) instead of `./Caddyfile.prod` (no TLS). No certs are provisioned in prod deploy → Caddy fails to start.                                                                                 |
| **No Terraform remote state**               | **P0**   | `deploy-production.yml:48` runs `terraform init` with no backend configured. State is ephemeral; import workaround is unreliable for production workloads. First-time provision works; subsequent updates to infrastructure will likely fail or create duplicates. |
| **Missing approval gate**                   | **P1**   | `deploy-production.yml` triggers on push to `main` — no GitHub Environment, no required reviewers, no deployment branch protections. A direct push to main deploys to production without review.                                                                   |
| Node version mismatch                       | P1       | Node 20 instead of 22 (all other workflows use 22).                                                                                                                                                                                                                |
| `git pull` on droplet without safety checks | P1       | No `git stash`, no dirty-tree detection, no fallback. A dirty working tree aborts the deploy.                                                                                                                                                                      |
| No rollback capability                      | P1       | No `docker compose -f previous.yml` fallback. `docker image prune -af` removes previous SHA-tagged images.                                                                                                                                                         |

---

## Prioritized Implementation Roadmap

### Immediate (P0 — blocking production)

| #   | Task                                                                                                              | Files Affected                                  | Effort |
| --- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------ |
| 1   | **Fix prod compose Caddyfile reference**: Change `./Caddyfile` to `./Caddyfile.prod` in `docker-compose.prod.yml` | `infra/docker/docker-compose.prod.yml:18`       | 5 min  |
| 2   | **Configure Terraform remote state backend** (e.g., DO Spaces S3-compatible, or GH Environments)                  | `infra/terraform/versions.tf`, 3 workflow files | 2-4 hr |
| 3   | **Add GitHub Environment with required reviewers** for production deploy                                          | `.github/workflows/deploy-production.yml`       | 30 min |

### High (P1 — next sprint)

| #   | Task                                                                                                                                        | Files Affected                                                      | Effort |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------ |
| 4   | **Add resource constraints** to all prod containers (`mem_limit`, `mem_reservation`)                                                        | `infra/docker/docker-compose.prod.yml`                              | 15 min |
| 5   | **Restrict SSH inbound** to CI runner IPs or bastion; restrict HTTP/HTTPS to Cloudflare IP ranges                                           | `infra/terraform/main.tf:34-49`                                     | 30 min |
| 6   | **Implement rollback strategy**: Preserve previous compose file, use SHA-tagged images for rollback, add `rollback` workflow_dispatch input | Both deploy workflows                                               | 2 hr   |
| 7   | **Fix node version** in production workflow to Node 22                                                                                      | `.github/workflows/deploy-production.yml:24`                        | 5 min  |
| 8   | **Fix deploy-dev aggressive prune**: Remove `--volumes` flag from prune, or exclude Caddy volumes                                           | `.github/workflows/deploy-development.yml:130`                      | 5 min  |
| 9   | **Add git safety** to prod deploy: `git stash` or `git reset --hard` before `git pull`                                                      | `.github/workflows/deploy-production.yml:186-188`                   | 10 min |
| 10  | **Add Cloudflare IP restriction** to DO firewall                                                                                            | `infra/terraform/main.tf` (add `data "cloudflare_ip_ranges"` block) | 15 min |

### Medium (P2 — next iteration)

| #   | Task                                                                                   | Files Affected                                                                      | Effort           |
| --- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------- |
| 11  | **Add concurrency control** to infra workflow                                          | `.github/workflows/infra-development.yml`                                           | 5 min            |
| 12  | **Add health endpoint routing** to Caddyfile.prod                                      | `infra/docker/Caddyfile.prod`                                                       | 5 min            |
| 13  | **Fix external health check** in dev deploy to fail properly on error                  | `.github/workflows/deploy-development.yml:219`                                      | 15 min           |
| 14  | **Add `depends_on: condition: service_healthy`** (or health check polling init script) | `infra/docker/docker-compose.devremote.yml`, `infra/docker/docker-compose.prod.yml` | 30 min           |
| 15  | **Upgrade droplet to s-2vcpu-2gb**                                                     | `infra/terraform/variables.tf:26`                                                   | 10 min + DO cost |

### Low (P3 — backlog)

| #   | Task                                                                                        | Files Affected                                     | Effort |
| --- | ------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------ |
| 16  | Add `pnpm-lock.yaml` to deploy-development.yml path filters                                 | `.github/workflows/deploy-development.yml`         | 2 min  |
| 17  | Add `NODE_ENV: development` to devremote common env anchor                                  | `infra/docker/docker-compose.devremote.yml`        | 2 min  |
| 18  | Merge pnpm install into single job in validate.yml (or add dependency caching between jobs) | `.github/workflows/validate.yml`                   | 1 hr   |
| 19  | Add DO monitoring alerts (CPU > 80%, memory > 80%)                                          | Infra-as-code or DO dashboard                      | 30 min |
| 20  | Add fallback `docker pull` in dev deploy as primary (pipe only on pull failure)             | `.github/workflows/deploy-development.yml:158-166` | 30 min |
