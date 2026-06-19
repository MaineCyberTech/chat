# Pre-Deploy Checklist

Before the first deploy, complete these steps.

## 1. Supabase Project

- [ ] Create Supabase project
- [ ] Copy `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Run all SQL migrations in the Supabase SQL Editor:
  1. `packages/db/sql/migrations/001_users.sql`
  2. `packages/db/sql/functions/handle_new_user.sql`
  3. `packages/db/sql/policies/users_rls.sql`
  4. `packages/db/sql/migrations/002_workspaces.sql`
  5. `packages/db/sql/policies/workspaces_rls.sql`
  6. `packages/db/sql/migrations/003_channels.sql`
  7. `packages/db/sql/policies/channels_rls.sql`
  8. `packages/db/sql/migrations/004_messages.sql`
  9. `packages/db/sql/policies/messages_rls.sql`
  10. `packages/db/sql/migrations/005_search.sql`
  11. `packages/db/sql/policies/storage_rls.sql`
- [ ] Enable auth provider: Email (magic link)
- [ ] Set Site URL to `https://chat.mainecybertech.us`

## 2. Generate CI SSH Key (One-Time)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/chat-ci -N "" -C "chat-ci"
cat ~/.ssh/chat-ci.pub   # Copy → GitHub secret CI_SSH_PUBLIC_KEY
cat ~/.ssh/chat-ci       # Copy → GitHub secret CI_SSH_PRIVATE_KEY
```

The workflow registers this key with DigitalOcean automatically on first deploy.

## 3. GitHub

- [ ] Settings → Actions → General → Workflow permissions → **Read and write**
- [ ] Settings → Secrets and variables → Actions → **Repository secrets**:
  - `DO_API_TOKEN` — DigitalOcean API token (read/write)
  - `CI_SSH_PUBLIC_KEY` — Public key from step 2
  - `CI_SSH_PRIVATE_KEY` — Private key from step 2
  - `SUPABASE_URL` — Supabase project URL
  - `SUPABASE_ANON_KEY` — Supabase anon key
  - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
  - `CF_API_TOKEN` — Cloudflare API token (Zone:DNS:Edit permission)
  - `CF_ZONE_ID` — Cloudflare Zone ID (from Overview → API section)
- [ ] (Optional) Settings → Environments → `production` → add required reviewers

## 3. First Deploy

- [ ] Push to `develop` branch
- [ ] Watch Actions tab:
  1. **validate** — lint, typecheck, test, build
  2. **provision** — Terraform creates droplet + DNS records, returns IP
  3. **build-images** — Docker multi-stage builds pushed to GHCR
  4. **deploy** — SSH to droplet, clone repo, write env, pull images, compose up
  5. **health check** — polls API `/healthz` until 200
- [ ] Verify: `curl https://chat-api.mainecybertech.us/healthz` returns 200
- [ ] Verify: `https://chat.mainecybertech.us` loads the login page

## 4. Production (repeat)

- [ ] Push to `main` or manually dispatch `deploy-production.yml`
- [ ] Workflow provisions a separate `.com` droplet + DNS records
- [ ] Verify: `https://chat-api.mainecybertech.com/healthz`

## GitHub Secrets Summary

| Secret                      | Used by              | Purpose                                 |
| --------------------------- | -------------------- | --------------------------------------- |
| `DO_API_TOKEN`              | provision            | Create droplet, DNS, upload SSH key     |
| `DO_SSH_PUBLIC_KEY`         | provision            | Register SSH key with DigitalOcean      |
| `DO_SSH_PRIVATE_KEY`        | deploy               | SSH into droplet as root                |
| `SUPABASE_URL`              | deploy               | Written to `.env` on droplet            |
| `SUPABASE_ANON_KEY`         | deploy               | Written to `.env` on droplet            |
| `SUPABASE_SERVICE_ROLE_KEY` | deploy               | Written to `.env` on droplet            |
| `GITHUB_TOKEN`              | build-images, deploy | Auto-provided; pushes/pulls GHCR images |
