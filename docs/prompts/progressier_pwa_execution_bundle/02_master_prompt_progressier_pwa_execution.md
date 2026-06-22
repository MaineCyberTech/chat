# Master Prompt — Progressier-Style PWA Implementation (Execution Mode)

You have full filesystem access to this repository.

Your task is to implement a production-grade, Progressier-style PWA feature set into this chat application while preserving working behavior.

## Product goals

Implement the following feature families:

1. PWA management
   - manifest
   - icons
   - service worker
   - update flow
   - installability readiness

2. Universal install experience
   - support install flows across iOS, Android, and desktop where browser/platform support exists
   - show tailored installation instructions

3. Installation UX
   - browser-aware install prompts
   - install prompts suitable for signed-out and signed-in users
   - a dedicated `/install` route/page

4. Push notifications
   - web push subscription storage
   - permission prompt flow
   - at least one working message-driven push trigger
   - user notification preferences
   - unsubscribe / revoke support

5. Optional advanced path
   - dynamic manifest or tenant-aware branding only if safe and clearly separable

## Repo-aware instructions

Work with the existing monorepo as-is.

Use current structure:

- `apps/web` for frontend PWA UX and install surfaces
- `apps/api` for push subscription APIs and notification dispatch logic
- `packages/db` for schema/types required by new data structures
- `packages/ui` for reusable UI if new primitives are needed

## Existing systems to extend

Extend existing notification architecture instead of creating a separate notification stack.

Inspect and leverage:

- `apps/api/src/modules/notifications/*`
- `apps/api/src/modules/messages/*`
- `apps/web/components/notifications/*`
- `apps/web/app/*`
- `apps/web/lib/*`

## Hard do-not-break zones

Treat these as critical-path systems:

- auth flow
- socket auth / connection flow
- existing route contracts
- current deployment workflows
- existing chat message behavior

## Implementation principles

- additive first
- reversible changes
- file-by-file traceability
- full validation
- no speculative rewrites
- no broad design system churn unrelated to install / push UX

## Phase sequence

Execute in this order:

1. Inventory and guardrails
2. PWA foundation and installability
3. Install UX and dedicated install page
4. Push notification infrastructure and preferences
5. Testing, observability, and release hardening
6. Optional dynamic manifest / branding path only if safe
7. Final reconciliation and output contract

## Required final deliverables

At completion, emit:

- exact changed file list
- exact new file list
- summary of architecture decisions
- exact commands run
- test / lint / typecheck / build results
- residual risks
- rollback notes
- suggested follow-on backlog
