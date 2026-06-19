# Architecture

## Documents

- [Bootstrap Foundation](bootstrap-foundation.md) — what was built in the bootstrap phase and what comes next
- [Repo Structure](repo-structure.md) — detailed directory and package layout

## High-Level Architecture

```
                    ┌──────────────────┐
                    │    Traefik LB    │
                    └───┬──────────┬───┘
                        │          │
              ┌─────────▼──┐  ┌───▼─────────┐
              │  Next.js    │  │  Express     │
              │  (web)      │  │  (api)       │
              └─────────────┘  └──────┬───────┘
                                      │
                              ┌───────▼───────┐
                              │   Supabase    │
                              │  (PostgreSQL) │
                              └───────────────┘
```

- **Single droplet** deployment (Debian 12, DigitalOcean)
- **Traefik** as reverse proxy with automatic Let's Encrypt TLS
- **Next.js** serves the frontend, **Express** serves the API
- **Supabase** provides PostgreSQL, auth, and real-time

## Non-Goals (Current Phase)

- Kubernetes or multi-node orchestration
- Redis or distributed caching
- Object storage (S3-compatible)
- TURN/STUN infrastructure
- Horizontal autoscaling
