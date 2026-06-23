# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [1.0.0] - 2026-06-22

### Added

- Initial release of Chat Platform
- Magic link authentication with Supabase
- Workspace and channel CRUD with RLS policies
- Real-time messaging with Socket.io (rooms, typing, presence)
- Threaded replies, message edit/delete
- File uploads via Supabase Storage signed URLs
- Full-text search with PostgreSQL tsvector
- 8 UI components (Avatar, Badge, Button, Dialog, Input, SidebarGroup, Skeleton, ThemeToggle)
- 7 SQL migrations with RLS policies
- Docker multi-stage builds with HEALTHCHECK
- CI/CD pipelines (validate, build, deploy)
- Terraform infrastructure for DigitalOcean
- Local development with Supabase CLI

---

## Release History

See [GitHub Releases](https://github.com/mainecybertech/chat/releases) for detailed release notes and artifacts.
