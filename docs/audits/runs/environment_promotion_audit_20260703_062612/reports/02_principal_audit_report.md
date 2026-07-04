# Principal Audit Report

- Prompt: **environment_promotion_audit**
- Domain: **ops**
- Run ID: **environment_promotion_audit_20260703_062612**
- Generated: **2026-07-03T06:35:00Z**
- Decision: **NO-GO**
- P0: **1**, P1: **3**
- P2: **3**, P3: **1**
- Readiness: **0.00**

## Findings

### P0 — Production deploy workflow has no staging environment or canary step — deploys directly to production droplet with zero traffic splitting or rollback capability
- **File:** `.github/workflows/deploy-production.yml`
- **Category:** Env Misalignment
- **Impact:** Any bad deploy immediately affects all production users. No gradual rollout, no health check before full traffic cutover. Rollback requires a second deploy.
- **Fix:** Add a blue/green deployment strategy or at minimum: (1) deploy to staging compose, (2) health check, (3) swap Caddy upstream to new containers, (4) hold old containers for rollback window

### P1 — Production deploy uses ssh-keyscan with no strict host key checking — `StrictHostKeyChecking=no` accepts any host key
- **File:** `.github/workflows/deploy-production.yml`
- **Category:** Env Misalignment
- **Impact:** Man-in-the-middle attack on SSH deploy connections. The deploy script connects to the production droplet without verifying its host key.
- **Fix:** Add known_hosts entry for the production droplet IP/hostname. Use StrictHostKeyChecking=accept-new as minimum.

### P1 — Production compose uses `image: ghcr.io/${{ github.repository }}/api:latest` tag — ':latest' is mutable and can be overwritten by a failed build
- **File:** `infra/docker/docker-compose.prod.yml`
- **Category:** Env Misalignment
- **Impact:** A partially built or broken image can replace the ':latest' tag, breaking future rollouts. No way to know which exact SHA is running in production.
- **Fix:** Use immutable tags: SHA-based (api:sha-abc123) or build-number-based. Update deploy workflow to reference the specific tag.

### P1 — Production deploy workflow uses `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` secrets for Terraform remote state — these are also used in infra-development.yml which provisions the infrastructure
- **File:** `.github/workflows/deploy-production.yml`
- **Category:** Env Misalignment
- **Impact:** Secrets are shared across workflows with no scoping. The production deploy workflow doesn't need Terraform state access — it deploys code, not infra.
- **Fix:** Remove Terraform state secrets from deploy-production.yml. Use separate read-only deploy tokens if infra state lookup is needed.

### P2 — Production web service has no CPU/memory resource limits set — a memory leak in Next.js can OOM the entire droplet
- **File:** `infra/docker/docker-compose.prod.yml`
- **Category:** Env Misalignment
- **Impact:** No resource isolation between services. A single runaway container can crash all services on the droplet.
- **Fix:** Add deploy.resources.limits block to each service in docker-compose.prod.yml (api: 512MB RAM, web: 512MB RAM, worker: 256MB RAM)

### P2 — Production compose mounts /var/run/docker.sock for the caddy service with read-write access — Caddy can manage Docker containers
- **File:** `infra/docker/docker-compose.prod.yml`
- **Category:** Env Misalignment
- **Impact:** If Caddy is compromised, the attacker has full Docker control. Caddy only needs TLS cert persistence, not Docker socket access.
- **Fix:** Remove docker socket mount. Caddy TLS certs should be stored in a named volume instead.

### P2 — Dev deploy workflow has `--force-recreate` flag but no `--pull always` — containers use the local cached image even if a newer version exists in GHCR
- **File:** `.github/workflows/deploy-development.yml`
- **Category:** Env Misalignment
- **Impact:** Deploy may use stale images if the build step was skipped or failed. Not pulling means the running image can diverge from the registry.
- **Fix:** Add `--pull always` to docker compose up in deploy-development.yml

### P3 — Production deploy runbook is incomplete — it documents steps 1-3 (build, transfer, compose up) but has no section for rollback, no section for monitoring the deploy, no section for verifying the deploy succeeded
- **File:** `docs/runbooks/production_deploy.md`
- **Category:** Documentation
- **Impact:** Operators following the runbook during an incident will have incomplete guidance. Missing critical out-of-band steps.
- **Fix:** Add rollback procedure, post-deploy verification checklist, and monitoring dashboard links to the runbook.
