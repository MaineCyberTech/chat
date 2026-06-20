# Bootstrap Foundation

## What Was Built

The bootstrap phase established a production-grade monorepo foundation, and subsequent phases implemented the full platform.

### Root Configuration

- Turborepo + pnpm workspaces
- TypeScript base config
- ESLint flat config with Next.js plugin
- Prettier + Tailwind plugin
- Vitest + Playwright configs
- Root script matrix

### Apps

- **`apps/web`**: Next.js 15 App Router, Tailwind 4, Caddy reverse proxy, Socket.io client
- **`apps/api`**: Express.js + Socket.io, JWT auth, rate limiting, Zod validation

### Packages

- **`packages/ui`**: 7 components (Avatar, Badge, Button, Dialog, Input, SidebarGroup, Skeleton)
- **`packages/db`**: Supabase client, 5 migrations, 4 policy sets, TypeScript types

### Infrastructure

- **Docker**: Multi-stage builds with Node 20 Alpine + ws for WebSocket compat
- **Caddy**: Zero-config TLS via auto-ACME (rate-limited until June 21)
- **Cloudflare DNS**: Proxied A records (Flexible SSL until Caddy certs issue)
- **Terraform**: DO droplet provisioning with cloud-init, DNS records, firewall
- **GitHub Actions**: 4 workflows (CI, build, deploy, infra)

### Testing

- 49 unit tests across 11 files (API services, middleware, UI components)
- E2E Playwright scaffold

### Documentation

- AGENTS.md — architecture overview and implementation status
- Architecture docs, environment model, runbooks
- Contributing guides, pre-deploy checklist
- Local dev setup/teardown scripts

## Deployment Status

| Component  | Status       | Notes                               |
| ---------- | ------------ | ----------------------------------- |
| Droplet    | Running      | Ubuntu 24.04, s-1vcpu-512mb-10gb    |
| Caddy      | Running      | Auto-retrying LE certs every 60s    |
| API        | Restarting   | Node 20 + ws transport fix deployed |
| Web        | Running      | NEXT*PUBLIC* vars passed at build   |
| Cloudflare | Flexible SSL | Workaround for LE rate limit        |
| CI         | Passing      | validate + build + deploy           |

## Known Issues

1. **LE rate limit**: 5 certs issued in 168h — resets June 21. Cloudflare Flexible SSL as workaround.
2. **512MB RAM**: Next.js + Express + Caddy push limits. Swap file mitigates. Upgrade to s-2vcpu-2gb recommended.
3. **Terraform state**: No remote backend — each CI run imports existing resources. Cleanup deletes duplicates.
4. **Docker build slow**: ~15min for pnpm install. GHA cache speeds up subsequent builds.

## Remaining Work

- Switch Cloudflare to Full (strict) after June 21
- Upgrade droplet to 1-2GB RAM
- Add Terraform remote state (S3 backend)
- Expand E2E tests
- Test production deploy with `.com` domain
- Add email notification system
