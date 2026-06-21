# Phase 4 — Risk, Stability, and "Do Not Break" Analysis

## 1. High-Risk Areas

| Area                                | Risk         | Blast Radius                                            | Why                                                                                                                                                                                                                                  |
| ----------------------------------- | ------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Auth middleware changes             | **Critical** | Entire app                                              | Breaking auth = 100% user impact. Current JWT middleware works. Any changes to session handling, cookie strategy, or token validation must be tested exhaustively.                                                                   |
| API route path changes              | **High**     | All existing clients, Caddy config, front-end API calls | Current same-domain routing in Caddyfile maps `/auth*`, `/workspaces*`, `/channels*`, `/messages*`, `/socket.io*` to API. Changing route paths would require coordinated updates to Caddy, front-end `api.ts`, and back-end routers. |
| Socket.io event contract changes    | **High**     | Real-time messaging                                     | Breaking event contracts (room join/leave, message send/receive, typing, presence) would break the core chat feature. Any new events must be additive only.                                                                          |
| Database schema migrations          | **High**     | All data, all queries                                   | Current has only 2 migrations. Adding new migrations is safe, but modifying existing ones (after they've been applied) would break Supabase. Must be additive only.                                                                  |
| Docker compose / deployment changes | **High**     | Production uptime                                       | Current deploy pipeline (build → push → pipe → compose up) is fragile (512MB droplet, manual cert handling). Breaking the deploy flow = site down.                                                                                   |

---

## 2. Medium-Risk Areas

| Area                        | Risk       | Blast Radius                      | Why                                                                                                                                                                                                               |
| --------------------------- | ---------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Adding Supabase seed data   | **Medium** | Local dev only                    | Seeds are additive and only run in local dev. Risk: seed data could conflict with existing migrations or trigger FK violations.                                                                                   |
| Package restructuring       | **Medium** | Build pipeline, import paths      | Renaming or restructuring packages (e.g., adding `@chat/config`) requires updating import paths across API, web, and other packages. Turbo cache invalidations could cause build failures.                        |
| Caddy configuration changes | **Medium** | HTTPS, routing, cert provisioning | Current Let's Encrypt certs are rate-limited until Jun 21. Any Caddy config change that triggers cert re-issuance could cause extended HTTPS outage. Use self-signed or Cloudflare certs until rate limit clears. |
| CI/CD workflow changes      | **Medium** | GitHub Actions, deployments       | Missing or misconfigured secrets, path filter changes, or workflow restructuring could silently break CI/CD. Deploy workflow has 219 lines of SSH commands — fragile.                                             |

---

## 3. Low-Risk Areas

| Area                             | Risk    | Blast Radius           | Why                                                                                                              |
| -------------------------------- | ------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Adding policy SQL files          | **Low** | Supabase policies only | Extracting existing RLS policies from migrations into separate files is purely organizational. No schema impact. |
| Adding documentation files       | **Low** | None                   | Documentation is additive only.                                                                                  |
| Adding test files                | **Low** | None                   | Tests are additive.                                                                                              |
| Adding shared config package     | **Low** | Build pipeline         | New package with shared ESLint/TSConfig is additive. Existing packages won't be affected until they opt-in.      |
| Adding Supabase migrations (new) | **Low** | Schema additions       | New migrations that only ADD tables/columns are safe. Modifying existing schema is high-risk.                    |

---

## 4. Changes That Need Tests First

| Change                           | Test Prerequisites                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth middleware changes          | Unit tests for all middleware functions. Integration tests for login, token validation, session refresh, and logout. E2E test for full auth flow. |
| API route path changes           | Integration tests for all affected routes. Caddy config validation test. Front-end API call adaptation tests.                                     |
| Socket.io event contract changes | Unit tests for event handlers. Integration tests for room lifecycle, message delivery, typing events. Load test for concurrent connections.       |
| Database schema changes          | Migration dry-run against a copy of production data. Integration tests for all affected queries. RLS policy tests.                                |
| Caddy config changes             | Local compose test with validation that paths resolve correctly. TLS cert provisioning test (if applicable).                                      |

---

## 5. Changes That Need Manual QA / Visual QA

| Change                            | QA Rationale                                                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| UI component library updates      | Visual regressions in shared components affect all pages. Need visual diff testing or manual check across pages.                    |
| Layout / navigation changes       | Current workspace layout (sidebar + chat view) is the primary user-facing interface. Any layout break would be immediately visible. |
| Landing page changes              | Only one landing page exists — visual break would be obvious but still needs verification.                                          |
| Caddy same-domain routing changes | Need to verify that all API paths resolve correctly and that the front-end still works without CORS issues.                         |

---

## 6. Changes That Could Affect Deployment or Environment Semantics

| Change                       | Environment Impact                                                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docker compose changes       | Port mappings, volume mounts, or network changes could break container communication. Current compose has 3 services (caddy, web, api). Adding services (redis, worker) would require resource planning on 512MB droplet. |
| Dockerfile changes           | Build stage changes, base image updates, or dependency installation changes could break production builds. Current multi-stage builds (node:22-alpine) are stable.                                                        |
| Environment variable changes | Adding/renaming env vars requires updates to .env.example, Docker compose, deploy workflow, Terraform cloud-init, and local dev scripts. Missing env var = runtime crash.                                                 |
| Terraform changes            | Any change that recreates the droplet causes downtime. Import-based workflow is fragile (creates duplicates as workaround).                                                                                               |

---

## 7. Do-Not-Break Guardrails

1. **Auth must never break.** No changes to `apps/api/src/modules/auth/`, `apps/web/lib/supabase/client.ts`, or `apps/web/components/auth/auth-context.tsx` without comprehensive test coverage first.
2. **Caddy route mappings must remain stable.** The six path prefixes (`/health`, `/auth`, `/workspaces`, `/channels`, `/messages`, `/socket.io`) are contracts between Caddy and the API. Changing them requires coordinated updates.
3. **Socket.io event names must be additive.** Current events (message:send, message:received, typing:start, typing:stop, user:presence, room:join, room:leave) must not be renamed or removed.
4. **Database migrations must be additive.** Never `DROP`, `ALTER COLUMN`, or `RENAME` existing tables/columns after migration has been applied. Use `CREATE` only.
5. **Production deploy must not be broken.** The deploy workflow SSH pipeline is the only way to update the droplet. Any change to `deploy-development.yml`, `docker-compose.devremote.yml`, or the Caddyfile must be tested locally first.
6. **Let's Encrypt certs must not be re-triggered until Jun 21.** Caddy changes that trigger new cert issuance will fail due to rate limiting. Use self-signed or Cloudflare Origin CA certs until the rate limit resets.
7. **No destructive refactors.** Large component rewrites, folder restructures, or package renames must be done incrementally with backward compatibility.

---

## 8. Safe Areas for Early Improvement

| Area                      | Action                                                     | Risk Level | Priority       |
| ------------------------- | ---------------------------------------------------------- | ---------- | -------------- |
| Supabase seed data        | Add `supabase/seeds/` with test data                       | Low        | Quick win      |
| RLS policy extraction     | Extract policies from migrations to `supabase/policies/`   | Low        | Quick win      |
| Shared config package     | Create `packages/config/` with shared ESLint + TSConfig    | Low        | Quick win      |
| Documentation             | Add inline docs, update AGENTS.md                          | None       | Continuous     |
| Test coverage             | Add tests for uncovered modules                            | None       | Continuous     |
| .env.example completeness | Ensure all env vars are documented                         | Low        | Quick win      |
| Supabase functions dir    | Create `supabase/functions/` directory (empty placeholder) | None       | Organizational |
