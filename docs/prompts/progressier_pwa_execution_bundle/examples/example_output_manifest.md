# Example Output Manifest

## Files changed

- apps/web/app/layout.tsx
- apps/web/app/page.tsx
- apps/web/components/home/landing-shell.tsx
- apps/web/components/app-header.tsx
- apps/web/components/notifications/notification-bell.tsx
- apps/api/src/modules/notifications/routes.ts
- apps/api/src/modules/notifications/service.ts
- apps/api/src/modules/messages/service.ts
- apps/web/.env.example
- apps/api/.env.example

## Files created

- apps/web/public/manifest.webmanifest
- apps/web/public/icons/icon-192.png
- apps/web/public/icons/icon-512.png
- apps/web/lib/pwa/service-worker.ts
- apps/web/lib/pwa/install-state.ts
- apps/web/lib/pwa/push-client.ts
- apps/web/components/pwa/install-prompt.tsx
- apps/web/components/pwa/install-instructions.tsx
- apps/web/components/pwa/notification-prompt.tsx
- apps/web/app/install/page.tsx
- packages/db/sql/migrations/xxx_push_subscriptions.sql

## Commands run

- pnpm install
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build
