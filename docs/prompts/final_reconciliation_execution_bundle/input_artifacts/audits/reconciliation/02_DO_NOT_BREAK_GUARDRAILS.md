# Do-Not-Break Guardrails

## Functional Guardrails

- **Auth flows that must not break**: Magic link sign-in/sign-out in `auth-context.tsx`, JWT token injection in `lib/api.ts`, session persistence in `lib/supabase/client.ts`
- **Role/permission-sensitive flows that must not break**: None currently — no RBAC UI
- **Critical business workflows that must not break**: Message send/receive via Socket.io, workspace/channel creation
- **API/route contracts that must not break**: Six Caddy path prefixes (`/health`, `/auth`, `/workspaces`, `/channels`, `/messages`, `/socket.io`), Socket.io event names (additive only)

## Frontend / UX Guardrails

- **Pages/layouts that should not be reorganized yet**: `/(workspace)/[workspaceSlug]/[channelId]` route structure, sidebar-as-primary-nav pattern
- **UX patterns that are working and should be preserved**: Inline message editing, hover-reveal actions, auto-redirect to workspace after auth
- **Areas where behavior matters more than visual polish**: Chat message delivery, auth flow, workspace/channel navigation
- **Areas that require visual QA before any change**: Dialog focus trap, responsive sidebar, icon replacements

## Deployment / Environment Guardrails

- **Dev/prod assumptions that must not drift**: Single-domain Caddy routing (not subdomain split), Docker compose for deployment
- **Environment variable contracts that must stay stable**: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, PORT, NODE_ENV
- **CI/CD workflows that must not be disrupted**: `deploy-development.yml` (219 lines of SSH commands), `build-push.yml` (path-filtered)
- **Secrets / integration assumptions that must not change**: GitHub Container Registry push auth, DO droplet SSH keys

## Refactor Guardrails

- **Files/folders currently off-limits**: `apps/api/src/modules/auth/`, `apps/api/src/modules/messages/`, `apps/web/components/auth/`, `apps/web/lib/socket.ts`, `apps/web/lib/api.ts`, `infra/docker/Caddyfile`, `infra/docker/docker-compose.devremote.yml`, `.github/workflows/deploy-development.yml`
- **Areas that require tests first**: Any auth middleware changes, Socket.io event changes, Caddy route mapping changes, DB schema changes
- **Areas that require human review before acceptance**: Package restructuring, Terraform changes, worker/Redis addition
- **Naming or structure that should not be changed yet**: Route URL patterns (`/[workspaceSlug]/[channelId]`), Socket.io event names, Caddy path prefixes

## Explicit Non-Goals

- **Changes we are not pursuing right now**: Server component migration, dark-only theme, cyber aesthetic, glass cards, OrgSwitcher, admin panel
- **Optimizations we intentionally defer**: Background worker (needs droplet upgrade), notification system (needs worker), load testing (pre-launch)
- **Reference-repo similarities we explicitly do not want to force**: Flat routes/ structure, raw ws library, separate API subdomain, Jest test framework, separate CI workflows, AWS Terraform
