# Phase 2: Feature Mapping — Comparative Audit

## Folder-to-Folder Equivalents

| Mattermost                          | Chat                               | Match      | Notes                                                                     |
| ----------------------------------- | ---------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `server/channels/app/`              | `apps/api/src/modules/`            | ≈ Similar  | Both house business logic; MM is monolithic Go, Chat is modular TS        |
| `server/channels/api4/`             | `apps/api/src/modules/*/routes.ts` | ≈ Similar  | REST handlers; MM has 167 handler files, Chat has 24 module dirs          |
| `server/channels/store/`            | `packages/db/src/stores/`          | ≈ Similar  | Data access layer; MM uses sqlstore, Chat uses Supabase store abstraction |
| `server/channels/wsapi/`            | `apps/api/src/lib/socket.ts`       | ≈ Similar  | WebSocket handling; MM has 5 files, Chat uses Socket.io                   |
| `server/channels/jobs/`             | `apps/worker/src/processors/`      | ≈ Similar  | Background jobs; MM has 47 job dirs, Chat has 6 BullMQ processors         |
| `server/platform/shared/`           | `packages/`                        | ≈ Similar  | Shared libs; MM has 5, Chat has 4                                         |
| `webapp/channels/src/components/`   | `apps/web/components/`             | ≈ Similar  | UI components; MM has 358 dirs, Chat has ~12 dirs with fewer components   |
| `webapp/platform/client/`           | `packages/sdk/`                    | ≈ Similar  | API client; MM has `Client4`, Chat has typed SDK                          |
| `webapp/platform/mattermost-redux/` | —                                  | ❌ Missing | Chat uses React context/hooks instead of Redux                            |
| `server/config/`                    | `packages/config/`                 | ≈ Similar  | Config management; Chat's is simpler                                      |
| `server/templates/`                 | —                                  | ❌ Missing | Chat uses JSX/components for emails                                       |
| `server/i18n/`                      | `apps/web/lib/i18n/`               | Partial    | MM has 55 locales, Chat has 1 (en.json)                                   |
| `webapp/channels/src/i18n/`         | `apps/web/lib/i18n/`               | Partial    | MM has 68 web locale files, Chat has 1                                    |
| `server/public/model/`              | `packages/db/src/types.ts`         | Partial    | MM has 291 model files, Chat has centralized types                        |
| `server/public/plugin/`             | —                                  | ❌ Missing | Chat has no plugin system                                                 |
| `e2e-tests/`                        | `tests/e2e/` + `apps/web/e2e/`     | ≈ Similar  | Both have Playwright; MM also has Cypress                                 |
| `.github/workflows/`                | `.github/workflows/`               | Partial    | MM has 41 workflows, Chat has 20                                          |
| `server/enterprise/`                | —                                  | ❌ Missing | Chat has no enterprise tier (all features are free)                       |
| `server/cmd/mmctl/`                 | —                                  | ❌ Missing | Chat has no CLI tool                                                      |
| `server/build/`                     | `infra/docker/`                    | ≈ Similar  | Docker + compose; Chat also has Terraform IaC                             |
| `docs/`                             | `docs/`                            | Partial    | Chat has more security/audit docs; MM has more API docs                   |
| `api/v4/` (OpenAPI spec)            | `apps/api/src/modules/openapi/`    | Partial    | Chat has smaller OpenAPI surface                                          |
| `server/channels/db/migrations/`    | `supabase/migrations/`             | ≈ Similar  | DB migrations; Chat has rollback scripts, MM doesn't                      |

## Feature-to-Feature Equivalents

### Core Messaging

| Feature          | Mattermost                | Chat                                       | Status       |
| ---------------- | ------------------------- | ------------------------------------------ | ------------ |
| Send message     | `post.go` + `new_post.ts` | `messages/routes.ts` + `message-input.tsx` | ✅ Both      |
| Edit message     | `post.go` (rewrite)       | `messages/routes.ts` (edit + history)      | ✅ Both      |
| Delete message   | `post.go`                 | `messages/routes.ts`                       | ✅ Both      |
| Threaded replies | `thread.go`               | `threads/` + `thread-panel.tsx`            | ✅ Both      |
| Reactions        | `reaction.go`             | `reactions/routes.ts` + `emoji-picker.tsx` | ✅ Both      |
| Pin messages     | — (not in MM server)      | `messages/routes.ts` + `is_pinned` column  | ✅ Chat only |
| Flag messages    | `content_flagging.go`     | `message_flags` table                      | ✅ Both      |
| Scheduled posts  | `scheduled_post.go`       | `scheduled-posts/`                         | ✅ Both      |
| Forward messages | —                         | `messages/routes.ts`                       | ✅ Chat only |

### Channels

| Feature              | Mattermost              | Chat                                 | Status  |
| -------------------- | ----------------------- | ------------------------------------ | ------- |
| Public channels      | `channel.go`            | `channels/routes.ts`                 | ✅ Both |
| Private channels     | `channel.go`            | `channels/routes.ts`                 | ✅ Both |
| DM channels          | `channel.go` (indirect) | `dm_channels` table                  | ✅ Both |
| GM channels          | `channel.go`            | `group_messaging` migration          | ✅ Both |
| Channel bookmarks    | `channel_bookmark.go`   | `channel-bookmarks.tsx`              | ✅ Both |
| Channel categories   | `channel_category.go`   | `sidebar/` module                    | ✅ Both |
| Channel mute         | —                       | `notification-preferences-modal.tsx` | ✅ Chat |
| Read-only channels   | —                       | `read_only_channels` migration       | ✅ Chat |
| Channel member count | —                       | `chat-view.tsx`                      | ✅ Chat |

### Users & Auth

| Feature               | Mattermost                        | Chat                                   | Status       |
| --------------------- | --------------------------------- | -------------------------------------- | ------------ |
| Email/password auth   | `login.go` + `authentication.go`  | —                                      | ❌ MM only   |
| Magic link auth       | `magic_link.go`                   | `auth/routes.ts`                       | ✅ Chat only |
| OAuth (Google/GitHub) | `oauth.go` (GitLab)               | `auth/routes.ts` (Google+GitHub)       | ✅ Both      |
| MFA/2FA               | `mfa.go` + `platform/shared/mfa/` | —                                      | ❌ MM only   |
| User status           | `status.go`                       | `status/routes.ts` + `app-sidebar.tsx` | ✅ Both      |
| Custom status         | —                                 | `custom_status` migration + modal      | ✅ Chat only |
| User groups           | `group.go`                        | `user-groups/` module                  | ✅ Both      |
| User presence         | `status.go` (WS)                  | `socket.ts` + `user_presence` table    | ✅ Both      |

### Notifications

| Feature                 | Mattermost                     | Chat                                     | Status    |
| ----------------------- | ------------------------------ | ---------------------------------------- | --------- |
| Push notifications      | `notification_push.go`         | `notifications/` + `worker`              | ✅ Both   |
| Email notifications     | `notification_email.go`        | Nodemailer via worker                    | ✅ Both   |
| Desktop notifications   | Notification API               | Push API + service worker                | ≈ Similar |
| Per-channel notif prefs | `channel_notifications_modal/` | `channel_notification_preferences` table | ✅ Both   |
| Notification sounds     | `sounds/` (10 files)           | `notification-sound.ts` (9 options)      | ✅ Both   |

### Files & Media

| Feature           | Mattermost      | Chat               | Status       |
| ----------------- | --------------- | ------------------ | ------------ |
| File upload       | `upload.go`     | Upload API         | ✅ Both      |
| File preview      | `file_preview/` | `file-preview.tsx` | ✅ Both      |
| Image proxy       | `imageproxy/`   | —                  | ❌ MM only   |
| Video/audio calls | —               | LiveKit WebRTC     | ✅ Chat only |

### Search

| Feature             | Mattermost                    | Chat                             | Status  |
| ------------------- | ----------------------------- | -------------------------------- | ------- |
| Message search      | `search_params.go`            | `apps/web/lib/api.ts` + tsvector | ✅ Both |
| Search autocomplete | `search_bar/` + suggestions   | `search-bar.tsx`                 | ✅ Both |
| File search         | `file_info_search_results.go` | Search (limited)                 | ✅ Both |

### Admin

| Feature            | Mattermost                          | Chat                          | Status            |
| ------------------ | ----------------------------------- | ----------------------------- | ----------------- |
| Admin console (UI) | `admin_console/` (comprehensive)    | —                             | ❌ MM only        |
| Audit logs         | `audit.go`                          | `audit/` module               | ✅ Both           |
| Data retention     | `data_retention.go`                 | `data-retention.ts` processor | ✅ Both           |
| Compliance export  | `compliance.go` + `message_export/` | `export/` module              | ≈ Similar         |
| System console     | `admin_console/` (30+ sections)     | `admin/routes.ts` (minimal)   | ❌ MM much richer |

### Integration

| Feature             | Mattermost                    | Chat                             | Status              |
| ------------------- | ----------------------------- | -------------------------------- | ------------------- |
| Webhooks (incoming) | `incoming_webhook.go`         | `webhooks/routes.ts`             | ✅ Both             |
| Webhooks (outgoing) | `outgoing_webhook.go`         | `webhook-delivery.ts` processor  | ✅ Both             |
| Slash commands      | `slashcommands/` (61 files)   | `slash-commands.ts` (7 commands) | ✅ Both (MM richer) |
| OAuth apps          | `oauth.go`                    | —                                | ❌ MM only          |
| Plugin system       | `plugin/` (full SDK + market) | —                                | ❌ MM only          |
| Bot accounts        | `bot.go`                      | —                                | ❌ MM only          |

### Onboarding & UI

| Feature            | Mattermost                          | Chat                               | Status    |
| ------------------ | ----------------------------------- | ---------------------------------- | --------- |
| Onboarding tour    | `tours/` (15+ files)                | `onboarding-tour.tsx`              | ✅ Both   |
| Drafts             | `drafts/` (20+ files)               | Auto-save (localStorage)           | ≈ Similar |
| Keyboard shortcuts | `keyboard_shortcuts/`               | `keyboard-shortcuts.tsx`           | ✅ Both   |
| Emoji picker       | `emoji_picker/` (full categories)   | `emoji-picker.tsx` (11 categories) | ✅ Both   |
| WYSIWYG editor     | `advanced_text_editor/` (30+ files) | `tiptap-editor.tsx`                | ✅ Both   |
| Slash menu         | `suggestion/` + autocomplete        | `slash-commands.ts`                | ✅ Both   |

### Infrastructure

| Feature        | Mattermost                 | Chat                              | Status                            |
| -------------- | -------------------------- | --------------------------------- | --------------------------------- |
| Docker compose | `build/docker-compose.yml` | `infra/docker/` (3 compose files) | ✅ Both                           |
| Terraform IaC  | —                          | `infra/terraform/`                | ✅ Chat only                      |
| CI/CD          | 41 workflows               | 20 workflows                      | ✅ Both (Chat more audit-focused) |
| PWA            | —                          | Service worker + manifest         | ✅ Chat only                      |
| Load testing   | —                          | `tests/k6/`                       | ✅ Chat only                      |
| Chaos testing  | —                          | `tests/chaos/`                    | ✅ Chat only                      |

## What's Missing in Each Repo

### In Chat (present in Mattermost)

| Missing Item           | MM Reference                                    | Impact                      |
| ---------------------- | ----------------------------------------------- | --------------------------- |
| Plugin system          | `server/public/plugin/` + marketplace           | High — extensibility        |
| MFA/2FA                | `server/platform/shared/mfa/`                   | Medium — security           |
| Admin console UI       | `webapp/channels/src/components/admin_console/` | Medium — admin UX           |
| CLI tool (mmctl)       | `server/cmd/mmctl/`                             | Low — ops convenience       |
| Bot accounts           | `server/channels/app/bot.go`                    | Medium — automation         |
| OAuth app integration  | `server/channels/app/oauth.go`                  | Medium — integrations       |
| i18n (55+ locales)     | `server/i18n/` + `webapp/channels/src/i18n/`    | Medium — localization       |
| Image proxy            | `server/platform/services/imageproxy/`          | Low — security              |
| Enterprise features    | `server/enterprise/`                            | Low — monetization          |
| Email templates (MJML) | `server/templates/` (49 files)                  | Low — polish                |
| MySQL support          | `server/config/migrations/mysql/`               | Low — Chat is Postgres-only |
| Performance telemetry  | `server/channels/app/imaging/`                  | Low                         |

### In Mattermost (present in Chat)

| Missing Item            | Chat Reference                     | Impact                   |
| ----------------------- | ---------------------------------- | ------------------------ |
| Store abstraction layer | `packages/db/src/stores/`          | Medium — testability     |
| Rollback migrations     | `supabase/rollback/` (52 scripts)  | High — ops safety        |
| Terraform IaC           | `infra/terraform/`                 | Medium — reproducibility |
| BFF layer               | `apps/web/app/api/v1/.../route.ts` | Medium — security        |
| Optimistic UI           | `apps/web/lib/optimistic/`         | Medium — UX              |
| PWA support             | `apps/web/components/pwa/`         | Medium — mobile          |
| WebRTC calls            | LiveKit integration                | Medium — communication   |
| Hardening pipeline      | `hardening/` + audit workflows     | Medium — security        |
| Chaos testing           | `tests/chaos/`                     | Low — reliability        |
| k6 load testing         | `tests/k6/`                        | Medium — performance     |
| SDK package             | `packages/sdk/`                    | Medium — DX              |
| Storybook               | `.storybook/`                      | Low — component dev      |
| RBAC permissions        | `packages/db/src/permissions.ts`   | Medium — access control  |
| Message pinning         | `messages/routes.ts`               | Low — feature            |
| Message forwarding      | `messages/routes.ts`               | Low — feature            |

## Naming/Organizational Mismatches

| Area                | Mattermost                                       | Chat                                        | Mismatch Impact          |
| ------------------- | ------------------------------------------------ | ------------------------------------------- | ------------------------ |
| Module organization | Flat files (293 in app/)                         | Domain modules (routes.ts + service.ts)     | Chat is cleaner          |
| API versioning      | `api4/` prefix on all routes                     | `/v1/` prefix applied centrally             | Minor naming             |
| Store layer         | `store/` with sub-layers (sqlstore, cache, etc.) | `stores/` with interfaces + implementations | Minor naming             |
| State management    | Redux (actions, reducers, selectors, store)      | React hooks + context                       | Architectural difference |
| Styling             | SASS (.scss files)                               | Tailwind CSS (inline classes)               | Architectural difference |
| Build system        | Makefile + Webpack                               | Turborepo + pnpm                            | Chat is more modern      |
| Config format       | Go structs + JSON                                | TypeScript env-schema                       | Language difference      |
| File naming         | Snake case (.go), camelCase (.tsx)               | kebab-case (.tsx)                           | Minor convention         |
| Test location       | Co-located (`*_test.go`)                         | Co-located (`__tests__/` dirs)              | Minor convention         |
| Migration naming    | Timestamp-based                                  | Date-based (`YYYYMMDD_`)                    | Minor format             |
