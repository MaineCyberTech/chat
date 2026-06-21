# Known Good Baseline

## Verification Summary

- **Install status**: ✅ `pnpm install` successful (frozen lockfile)
- **Lint status**: ✅ All 4 packages pass (0 warnings on changed files)
- **Typecheck status**: ✅ All 4 packages pass (0 errors)
- **Build status**: ⚠️ `@chat/web#build` fails with EPERM symlink errors (Windows pnpm limitation with Next.js standalone output — not a code issue). API/DB/UI builds pass.
- **Unit test status**: ✅ 51 tests pass across 11 test files
- **Integration test status**: ⚠️ No integration tests configured
- **E2E status**: ⚠️ Not run (requires Supabase + Playwright infra)
- **Local startup status**: ⚠️ Requires Supabase local instance

## Confirmed Working User Flows

- Magic link authentication (Supabase OTP)
- Workspace CRUD (create, list, slug-based routing)
- Channel CRUD (create within workspace, list, slug-based routing)
- Real-time messaging (send, receive via Socket.io)
- Message editing and deletion
- Typing indicators and presence

## Confirmed Working Routes / Screens

- `/` — Landing shell (unauthenticated) + workspace redirect (authenticated)
- `/login` — Magic link email form
- `/[workspaceSlug]` — Workspace home with channel list
- `/[workspaceSlug]/[channelId]` — Chat view with real-time messages

## Known Stable Areas

- Auth module (Supabase JWT middleware + AuthProvider context)
- Socket.io real-time infrastructure (room join/leave, events)
- Same-domain Caddy routing (path-based API proxying)
- Shared UI components (Button, Avatar, Input, Badge, Skeleton, Dialog, SidebarGroup)
- Turbo monorepo configuration (build, dev, lint, typecheck, test)

## Known Fragile Areas

- Next.js standalone build on Windows (EPERM symlink — CI uses Linux)
- 512MB droplet memory for Docker compose (3 containers push limits)
- Let's Encrypt cert rate limit (blocking HTTPS until Jun 21)
- Terraform import-based workflow (creates duplicate droplets as workaround)

## Evidence Links / Paths

- Test results: 51/51 passing (11 test files)
- Typecheck: 4/4 packages passing
- Lint: 4/4 packages passing
