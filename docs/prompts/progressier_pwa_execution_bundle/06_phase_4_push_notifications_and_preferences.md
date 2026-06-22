# Phase 4 — Push Notifications and Preferences

Extend the existing notifications architecture with web push support.

## Objective

Add web push subscription, delivery, and user control while preserving the in-app notification system.

## Existing architecture assumption

This repo already contains:

- notifications routes and services
- notification UI in the web app
- message creation paths that can already create notifications

You must extend those systems rather than creating a second, disconnected notification subsystem.

## Required outcomes

Implement:

- subscription registration API
- subscription deletion / unsubscribe flow
- persistence for web push subscriptions
- permission prompt UX
- user notification preferences
- at least one working message-driven push trigger
- safe no-op behavior when push is unavailable

## Candidate trigger events

Choose a conservative first set:

- reply notifications
- mention notifications if mention parsing exists or can be added safely
- direct-message style event only if the repo already models it safely

## Suggested file targets

Backend:

- `apps/api/src/modules/notifications/routes.ts`
- `apps/api/src/modules/notifications/service.ts`
- `apps/api/src/modules/messages/service.ts`
- schema / migration locations in repo

Frontend:

- `apps/web/components/notifications/notification-bell.tsx`
- new `apps/web/components/pwa/notification-prompt.tsx`
- new `apps/web/lib/pwa/push-client.ts`
- minimal bootstrap in app layout or header only if safe

## Rules

1. Do not remove or replace current in-app notifications.
2. Do not block message creation if push delivery fails.
3. Push must be best-effort and observable.
4. Add preferences in a way that can be expanded later.
5. Keep blast radius low in auth and socket code.
6. Avoid speculative vendor lock-in abstractions unless clearly useful.

## Required validation

Report:

- schema changes
- migration files created
- endpoint contracts
- frontend interaction flow
- failure handling behavior
- exact validation commands and results
