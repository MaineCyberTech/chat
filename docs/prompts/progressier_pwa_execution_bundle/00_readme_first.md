# Progressier-Style PWA Execution Bundle

## Purpose

This bundle instructs an AI coding agent with full repository access to implement a production-grade PWA and install/notification experience into the existing chat application.

The implementation target is the existing monorepo:

- `apps/web` = Next.js 15 frontend
- `apps/api` = Express + Socket.IO backend
- `packages/db` = DB/shared types/SQL
- `packages/ui` = shared UI primitives

The implementation goals are modeled after a Progressier-style feature set:

1. PWA management (manifest, icons, service worker)
2. Universal installation across iOS / Android / desktop
3. Browser- and platform-aware installation instructions
4. Dedicated install page
5. Push notifications with user preferences and event triggers
6. Optional dynamic manifest / branded install model

## Critical constraints

The agent must preserve all currently working behavior unless a change is explicitly required and validated.

Do not break:

- authentication flow
- current Socket.IO behavior
- current deployment pipeline
- current routing contracts already consumed by the frontend

## Expected output style

The AI must operate in execution mode:

- inspect repo files directly
- make changes in-place
- emit a file-by-file change log
- run validation commands
- report exact changed files
- stop if a high-risk regression is detected

## Completion standard

A successful run will:

- add PWA installability
- add install UX and an install page
- add push subscription infrastructure and at least one working notification trigger
- preserve auth, chat, and deployment behavior
- document all changes
