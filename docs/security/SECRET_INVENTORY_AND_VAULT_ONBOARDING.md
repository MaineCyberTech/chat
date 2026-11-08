# Secret inventory and Vault onboarding plan

Status: **planning only**. No values were read or migrated, and no live Vault,
GitHub or host changes are included in this document.

Scope: secrets declared by this repository in `.env.example`,
`.env.local.example`, `infra/docker/.env.*.example` and
`.github/workflows/*.yml`. Paths below are names only; the values remain in
GitHub Actions secrets or the runtime environment until the owner migrates them.

## Inventory — credentials

| Credential                  | Class            | Current declaration / consumer                                             | Proposed Vault path                          |
| --------------------------- | ---------------- | -------------------------------------------------------------------------- | -------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime          | `.env.example`, `infra/docker/.env*.example`, API/worker; deploy workflows | `secret/chat/prod/SUPABASE_SERVICE_ROLE_KEY` |
| `SUPABASE_ACCESS_TOKEN`     | CI               | `supabase-migrations.yml`, `seed-database.yml`, `validate.yml`             | `secret/chat/ci/SUPABASE_ACCESS_TOKEN`       |
| `SUPABASE_DB_PASSWORD`      | CI               | `supabase-migrations.yml`, `validate.yml`                                  | `secret/chat/ci/SUPABASE_DB_PASSWORD`        |
| `LIVEKIT_API_KEY`           | runtime + deploy | `.env.example`, Docker env templates, deploy workflows                     | `secret/chat/prod/LIVEKIT_API_KEY`           |
| `LIVEKIT_API_SECRET`        | runtime + deploy | `.env.example`, Docker env templates, deploy workflows                     | `secret/chat/prod/LIVEKIT_API_SECRET`        |
| `VAPID_PRIVATE_KEY`         | runtime + deploy | `.env.example`, Docker env templates, deploy workflows                     | `secret/chat/prod/VAPID_PRIVATE_KEY`         |
| `WEBHOOK_ENCRYPTION_KEY`    | runtime          | `.env.example`, `infra/docker/.env.prod.example`                           | `secret/chat/prod/WEBHOOK_ENCRYPTION_KEY`    |
| `JWT_SECRET`                | runtime          | `.env.example`                                                             | `secret/chat/prod/JWT_SECRET`                |
| `SMTP_PASS`                 | runtime          | `.env.example`, API/worker SMTP config                                     | `secret/chat/prod/SMTP_PASS`                 |
| `METRICS_TOKEN`             | runtime + deploy | `.env.example`, Docker env templates, deploy workflows                     | `secret/chat/prod/METRICS_TOKEN`             |
| `CHAT_NTFY_PASS`            | runtime + deploy | `.env.example`, Docker env templates, deploy workflows                     | `secret/chat/prod/CHAT_NTFY_PASS`            |
| `CF_ORIGIN_KEY`             | runtime TLS      | `.env.example`, Caddy origin config, deploy workflows                      | `secret/chat/prod/CF_ORIGIN_KEY`             |
| `CF_API_TOKEN`              | CI               | `deploy-production.yml`, `infra-development.yml`                           | `secret/chat/ci/CF_API_TOKEN`                |
| `DO_API_TOKEN`              | CI               | `chaos-tests.yml`, deploy/infra workflows                                  | `secret/chat/ci/DO_API_TOKEN`                |
| `DO_SSH_PRIVATE_KEY`        | CI               | `deploy-production.yml`                                                    | `secret/chat/ci/DO_SSH_PRIVATE_KEY`          |
| `DO_SSH_PASSPHRASE`         | CI               | `deploy-production.yml`                                                    | `secret/chat/ci/DO_SSH_PASSPHRASE`           |
| `CI_SSH_PRIVATE_KEY`        | CI               | deploy, infra and chaos workflows                                          | `secret/chat/ci/CI_SSH_PRIVATE_KEY`          |
| `AWS_SECRET_ACCESS_KEY`     | CI               | `infra-development.yml` (Terraform state backend)                          | `secret/chat/ci/AWS_SECRET_ACCESS_KEY`       |

`GITHUB_TOKEN` is issued automatically by GitHub Actions and has no Vault path.

## Inventory — non-secret configuration

Move these to GitHub `vars` (or plain runtime config), not `secrets`:
`ALERT_EMAIL`, `API_BASE_URL`, `API_ORIGIN`, `AWS_ACCESS_KEY_ID`,
`CF_ORIGIN_CERT`, `CF_ZONE_ID`, `CHAT_NTFY_URL`, `CHAT_NTFY_USER`,
`CI_SSH_FINGERPRINT`, `CI_SSH_PUBLIC_KEY`, `FRONTEND_URL`,
`LIVEKIT_HOST`, `NEXT_PUBLIC_*`, `NODE_ENV`, `PORT`, `REDIS_URL`,
`RATE_LIMIT_*`, `MAX_FILE_SIZE_MB`, `UPLOAD_TTL_SECONDS`, `SENTRY_DSN`,
`SENTRY_ENVIRONMENT`, `SMTP_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SSH_ALLOWED_IPS`, `SUPABASE_ANON_KEY`, `SUPABASE_PROJECT_REF`,
`SUPABASE_URL`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`, `LOG_LEVEL`.

`REDIS_URL` must be treated as a credential if it ever embeds a password.
`SUPABASE_ANON_KEY` and `VAPID_PUBLIC_KEY` are public client material.

## OIDC plan — CI

The current workflows run on `ubuntu-latest`; GitHub-hosted runners cannot reach
the lab Vault endpoint. Any job that fetches from Vault must run on a
self-hosted lab runner (`runs-on: [self-hosted, lab]`), or use a deliberately
published Vault endpoint with the same claim checks.

1. **Policy.** Apply `policies/repo-chat.hcl` from the `vault` repository as
   `chat-ci`. It must read only `secret/data/chat/ci/*` and metadata; it must
   never read `secret/chat/prod/*` or hold `sudo`.
2. **Role.** Create the OIDC role bound to the repository, not just the issuer.
   The current default branch is `develop`, so bind `chat-ci` to
   `bound_claims = { repository = "MaineCyberTech/chat", ref = "refs/heads/develop" }`.
   When a production `main` branch is created, add a separate `chat-ci-prod`
   role bound to `refs/heads/main`; do not widen `chat-ci`.
3. **Workflow.** Use `hashicorp/vault-action@v3` with:
   `url: https://vault-1.mct.lan:8200`,
   `caCertificate: ${{ vars.VAULT_CA_CERT }}`,
   `method: jwt`, `path: jwt`, `role: chat-ci`,
   `jwtGithubAudience: https://github.com/MaineCyberTech`.
   Fetch one key per step and keep `id-token: write` scoped to the job.
4. **Verify.** `vault read auth/jwt/role/chat-ci` must show the repository
   claim; `vault policy read chat-ci` must show no `secret/*` and no `sudo`.
5. **Canary.** Write a throwaway `secret/chat/ci/_canary`, read it from a
   self-hosted workflow, then prove the negative:
   `vault kv get secret/mainecybertech/prod` must return 403.
6. **Cut over.** Migrate one credential at a time, delete the matching GitHub
   secret last, and roll back by restoring the secret and reverting the
   workflow if a deploy fails.

## Host plan — droplet runtime

1. **Identity.** Create AppRole `chat-host` with policy `chat-host`
   (`policies/repo-chat-host.hcl`). It may read `secret/data/chat/prod/*` only.
2. **Transport.** The droplet reaches Vault over the lab-audit WireGuard
   overlay. Do not enable a public Vault listener for this host.
3. **Agent.** Run Vault Agent on the droplet. Install the role ID at
   `/etc/vault-agent/role-id` (0644) and the secret ID at
   `/etc/vault-agent/secret-id` (0600, root). Use a short token TTL (15m).
4. **Rendering.** Render the runtime env file to the path the containers
   already consume. Mount the **directory**, not the file, into Docker: the
   agent's atomic rename otherwise leaves the container on stale values.
5. **Rotation.** The host cannot renew its own `secret_id`; schedule
   `scripts/rotate-host-secret-id.sh chat-host` from CI using the
   `org/ci/examples/rotate-host-secret-ids.yml` pattern. Do not bind the
   secret ID to the client overlay CIDR: the lab host masquerades the overlay
   source address, so rely on the short TTL instead.
6. **Verify.** Confirm the agent login is audited under `chat-host`, confirm
   the rendered file has no world-readable mode, and restart one container to
   prove it reads the rendered values.

## Owner actions

- Decide the `ci/` vs `prod/` split for values used by both CI and runtime
  (the table above is the proposed split).
- Approve moving secret-fetching jobs to self-hosted lab runners.
- Rotate any credential at its provider before deleting the last GitHub copy.
- Schedule the `chat-host` secret-id rotation and record its owner.

No live migration is performed by this change.
