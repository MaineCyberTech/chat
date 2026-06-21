# Phased Prompt Pack — Execution Mode

## Production-Grade Real-Time Workspace Platform

This is the full platform implementation pack for an autonomous AI with repository filesystem access.

## Environment Model

### Development

- `https://chat.mainecybertech.us`
- `https://chat-api.mainecybertech.us`

### Production

- `https://chat.mainecybertech.com`
- `https://chat-api.mainecybertech.com`

### GitHub Environments

- `development`
- `production`

## Core Rules

- Work directly in the repo
- Create/modify files directly
- Run lint/typecheck/test/build/validation commands
- Repair actionable failures
- Preserve working code where practical
- Respect single-droplet initial deployment constraints
- Keep local / dev / production assumptions consistent

## Phase Order

1. Database Schema, SQL, and RLS
2. Express API and Socket.io Lifecycle
3. Next.js Client Chat Engine
4. Docker / Traefik Runtime Orchestration
5. Terraform + Cloud-Init Provisioning
6. GitHub Actions / CI-CD / Environment Promotion
7. Testing / Validation / Operational Runbooks

## Required Execution Report Format

For each phase return:

- `# PHASE: <phase name>`
- `## OBJECTIVE`
- `## REPO INSPECTION SUMMARY`
- `## IMPLEMENTATION PLAN`
- `## FILES CREATED`
- `## FILES MODIFIED`
- `## COMMANDS RUN`
- `## VALIDATION RESULTS`
- `## BLOCKERS`
- `## NEXT RECOMMENDED STEP`

## Phase 1 Summary

Implement the full SQL/data layer with migrations, indexes, FTS, RLS, and tenant-safe modeling.

## Phase 2 Summary

Implement production-grade Express + Socket.io backend with Supabase JWT auth, validation, routing, presence, search, webhooks, and WebRTC signaling.

## Phase 3 Summary

Implement Next.js app shell, workspace/channel/thread surfaces, virtualized chat, optimistic updates, reconnect-safe realtime, and rich composer UX.

## Phase 4 Summary

Implement Dockerfiles, compose files, Traefik routing, dev/prod host mapping, health checks, and runtime env examples.

## Phase 5 Summary

Implement Terraform + cloud-init for Debian 12 DigitalOcean droplet provisioning.

## Phase 6 Summary

Implement GitHub Actions workflows for CI, development deploy, and production deploy with environment-aware logic.

## Phase 7 Summary

Implement tests, validation scaffolds, runbooks, rollback notes, and operational documentation.
