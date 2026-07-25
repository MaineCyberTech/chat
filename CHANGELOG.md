# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-06

### Added

- Full 8-phase comparative audit against Mattermost (docs/audits/compare/)
- message-list.tsx decomposition: extracted MessageItem, ContextMenu, DeleteDialog sub-components
- Emoji picker: expanded from 600 to 3305 emojis, 11 category tabs, skin tone selector
- Keyboard shortcut modal: 4 categorized groups with search/filter
- i18n scaffolding: t() function, en.json with comprehensive keys
- Channel right-click context menu: favorite, mute, mark read, leave channel
- Search improvements: Messages/Files toggle tabs, operator hints, file extension autocomplete
- File preview: multi-file navigation, zoom controls (0.25x-5x), metadata panel
- Sidebar category management: drag-and-drop reorder, move channels between categories
- Global notification settings page: desktop/mobile/email notification preferences
- Store abstraction layer: IWorkspaceStore, IReactionStore, INotificationStore
- BFF proxy layer (Next.js route handler → Express API)
- 48 database migration rollback scripts
- Playwright visual snapshot tests
- 31 new test files covering all API modules, middleware, and UI components
- docker-compose.dev.yml for local development parity
- Storybook stories for Toast, MessageItem, ContextMenu, DeleteDialog
- k6 load test CI workflow
- E2E daily health check CI workflow

### Fixed

- BFF proxy: 502 errors from server-side auth mismatch, now forwards client Authorization header
- Pre-commit hook: lint-staged --max-warnings 100, turbo typecheck --continue
- Lint errors: any types, unused variables across 3 files
- CSP: removed unsafe-inline from style-src on API server

### Changed

- api.ts: reverted to direct API calls through Caddy (BFF was causing Docker network issues)
- AGENTS.md: trimmed from 838 to 321 lines, archived detailed tracking
- .gitignore: added coverage-ts, vite, snapshots, IDE files

### Performance

- Added 10 new database indexes (messages channel+created, notifications, user search)
- Narrowed SELECT \* to specific columns across messages, channels, workspaces services
- Applied responseCache middleware to 14 GET endpoints (15-30s TTL)
- Applied queryWithTimeout (10s) to 7 critical query sites
- Added 15s fetch timeout to all Supabase clients

### Security

- Added global unhandled rejection/exception handlers to Sentry
- Rate limiter: composite userId:ip key prevents IP-based bypass
- Graceful shutdown: drain keep-alive connections on SIGTERM/SIGINT

## [Unreleased]

### Added

- Webhook delivery pipeline with CRUD API routes and auto-trigger on message/channel/workspace events
- Idempotency key support for message creation (prevents duplicate messages on retries)
- Workspace member management endpoints (add, remove, update role)
- Channel member management endpoints (add, remove)
- Route-level membership middleware for defense-in-depth authorization
- Terraform remote state backend configuration (DO Spaces)
- Security audit fixes: cross-tenant search leak, storage RLS scoping, audit log RLS
- CI/CD improvements: coverage thresholds, build depends on test, E2E test job

### Changed

- Search function changed from `SECURITY DEFINER` to `SECURITY INVOKER` with workspace membership check
- Webhook infrastructure now functional with delivery logging and retry support
- Production Docker Compose uses correct Caddyfile
- SSH and HTTP/HTTPS firewall rules restricted to Cloudflare IP ranges
- Removed aggressive Docker volume pruning in development deploy

### Fixed

- macOS sed bug in setup-dev.sh (now uses uname for OS detection)
- Setup script now updates Supabase keys on every run, not just first run
- Added .husky/pre-commit hook for lint-staged
- Infra Docker README updated from Traefik to Caddy

See [GitHub Releases](https://github.com/mainecybertech/chat/releases) for detailed release notes and artifacts.
