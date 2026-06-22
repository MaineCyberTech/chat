# Phase 2 — PWA Foundation and Installability

Now implement the foundational PWA layer in the frontend.

## Objective

Make the app installable and standards-compliant using low-risk, additive changes.

## Required outcomes

Implement:

- a valid web app manifest
- icon set and references
- service worker registration
- installability readiness
- safe update UX
- no regression to current app navigation or auth/session behavior

## Preferred implementation locations

Use or create:

- `apps/web/public/manifest.webmanifest`
- `apps/web/public/icons/*`
- `apps/web/public/screenshots/*` if needed
- `apps/web/lib/pwa/service-worker.ts`
- `apps/web/lib/pwa/install-state.ts`
- `apps/web/components/pwa/*`
- `apps/web/app/layout.tsx` for minimal bootstrap integration if needed

## Rules

1. Avoid invasive layout rewrites.
2. Do not break current `AuthProvider` flow.
3. Do not introduce service worker behavior that disrupts active chat sessions.
4. If update handling is added, use a controlled opt-in refresh pattern.
5. Preserve existing visual language unless adding clearly scoped install UX.

## Required validation

Run and report:

- lint
- typecheck
- test
- build

If any PWA file requires app metadata changes in Next.js, document exactly what changed and why.
