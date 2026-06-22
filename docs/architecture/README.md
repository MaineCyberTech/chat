# Architecture

## Documents

- [Bootstrap Foundation](bootstrap-foundation.md) — what was built and current status
- [Repo Structure](repo-structure.md) — detailed directory and package layout
- [Portal Comparison Audit](portal-comparison-audit.md) — audit vs production portal repo

## High-Level Architecture

```
Browser → Cloudflare DNS → Caddy (TLS) → web:3000 (Next.js)
                                        → api:4000 (Express + Socket.io)
                                              → Supabase (PostgreSQL)
```

- **Single droplet** deployment (Ubuntu 24.04, DigitalOcean)
- **Caddy** as reverse proxy with automatic Let's Encrypt TLS
- **Next.js** serves the frontend, **Express** serves the API
- **Supabase** provides PostgreSQL, auth, and real-time

## Non-Goals (Current Phase)

- Kubernetes or multi-node orchestration
- Redis or distributed caching
- Object storage (S3-compatible)
- TURN/STUN infrastructure
- Horizontal autoscaling
