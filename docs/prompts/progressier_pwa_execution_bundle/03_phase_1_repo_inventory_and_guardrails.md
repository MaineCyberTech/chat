# Phase 1 — Repo Inventory and Guardrails

Inspect the repository and produce a precise implementation baseline before making changes.

## Objectives

1. Confirm current PWA-related state in `apps/web`
2. Confirm current notification and message-trigger architecture in `apps/api`
3. Confirm current UI entry points for install surfaces
4. Confirm current build, lint, test, and deployment paths
5. Identify exact critical-path files to avoid unnecessary disruption

## Required inspection targets

Inspect at minimum:

- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/(workspace)/layout.tsx`
- `apps/web/components/home/landing-shell.tsx`
- `apps/web/components/app-header.tsx`
- `apps/web/components/notifications/notification-bell.tsx`
- `apps/web/lib/api.ts`
- `apps/web/lib/socket.ts`
- `apps/web/components/auth/auth-context.tsx`

Inspect backend:

- `apps/api/src/server.ts`
- `apps/api/src/app.ts`
- `apps/api/src/modules/messages/routes.ts`
- `apps/api/src/modules/messages/service.ts`
- `apps/api/src/modules/notifications/routes.ts`
- `apps/api/src/modules/notifications/service.ts`

Inspect shared / schema areas likely affected:

- `packages/db`
- any Supabase SQL / migrations relevant to notifications and new subscription tables

Inspect validation / release pathways:

- root `package.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `.github/workflows/*`
- relevant Dockerfiles if environment variables will be required

## Output required before edits

Emit:

1. Inventory summary
2. Existing relevant files and their purpose
3. Existing gaps relative to requested feature set
4. High-risk change zones
5. Safe initial file insertion points
6. Proposed phase-specific file plan

Do not edit files yet until this baseline is complete.
