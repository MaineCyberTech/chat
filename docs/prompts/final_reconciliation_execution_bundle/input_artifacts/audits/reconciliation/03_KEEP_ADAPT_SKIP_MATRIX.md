# Keep / Adapt / Skip Matrix

| Area                       | Current Status                           | Reference Repo Pattern            | Decision         | Why                                                       | Risk Notes          |
| -------------------------- | ---------------------------------------- | --------------------------------- | ---------------- | --------------------------------------------------------- | ------------------- |
| **API structure**          | Feature-based modules/ (5 modules)       | Flat routes/ (27 files)           | **Keep**         | Modules/ is cleaner — co-located routes + service + tests | None                |
| **Shared UI components**   | 7 components in packages/ui/             | None (only cn.ts)                 | **Keep**         | Enables design system consistency                         | None                |
| **Real-time messaging**    | Socket.io (rooms, typing, presence)      | Raw ws library                    | **Keep**         | Far more capable for chat                                 | None                |
| **Caddy routing**          | Same-domain path-based                   | Separate subdomains               | **Keep**         | Simpler cookies, no CORS issues                           | None                |
| **Test runner**            | Vitest                                   | Jest                              | **Keep**         | Faster, ESM-native                                        | None                |
| **CI/CD**                  | Consolidated validate.yml + path filters | 8 separate workflows              | **Keep**         | Less duplication                                          | None                |
| **Docker HEALTHCHECK**     | Present on all containers                | Not present                       | **Keep**         | Critical for orchestration                                | None                |
| **Graceful shutdown**      | SIGTERM/SIGINT 10s drain                 | Not present                       | **Keep**         | Prevents dropped connections                              | None                |
| **Dark mode**              | prefers-color-scheme (user choice)       | Dark-only forced                  | **Keep**         | Respects user preference                                  | None                |
| **Font stack**             | System-ui                                | Inter + Orbitron (Google Fonts)   | **Keep**         | Faster load, no external request                          | None                |
| **Supabase seed data**     | None                                     | 5 seed files in supabase/seeds/   | **Adapt**        | Add seeds for reproducible dev                            | Low — additive only |
| **RLS policy files**       | Inlined in migrations                    | Standalone in supabase/policies/  | **Adapt**        | Extract for reviewability                                 | Low — additive only |
| **Shared config package**  | No packages/config/                      | packages/config/ exists           | **Adapt**        | Centralize ESLint/TSConfig                                | Low — additive      |
| **E2E tests**              | 1 homepage test                          | playwright.config.ts + e2e.yml    | **Adapt**        | Add workspace/channel/message tests                       | None                |
| **Local stack scripts**    | Basic setup/teardown                     | Full start-local-stack backup     | **Adapt**        | Add bootstrap script                                      | Low — scripts only  |
| **lucide-react icons**     | Unicode characters (↩, ✎, ✕)             | lucide-react library              | **Adapt**        | Add aria-labels, consistent icons                         | Low — visual only   |
| **Toast notifications**    | No success feedback                      | None either                       | **Adapt** (new)  | Add toast for create/send actions                         | Low                 |
| **Error boundaries**       | None                                     | None either                       | **Adapt** (new)  | Prevent full-page crashes                                 | Low                 |
| **Dialog focus trap**      | None                                     | None either                       | **Adapt** (new)  | Keyboard a11y fix                                         | Low                 |
| **Breadcrumbs**            | None                                     | PortalBreadcrumbs components      | **Skip for now** | Low priority for chat app                                 | —                   |
| **Responsive sidebar**     | Fixed w-60 at all sizes                  | Responsive grid utilities         | **Skip for now** | Requires layout refactor                                  | Medium              |
| **Notification system**    | Not implemented                          | Full notification routes + worker | **Skip**         | Needs worker + Redis first                                | High                |
| **Worker app**             | Not implemented                          | BullMQ + Redis worker             | **Skip**         | Needs droplet upgrade                                     | High                |
| **Admin panel**            | Not implemented                          | 18 admin components               | **Skip**         | Domain doesn't require it yet                             | —                   |
| **Cyber aesthetic**        | Light/dark neutral                       | Dark-only + glass cards + emerald | **Skip**         | Wrong for chat app                                        | —                   |
| **Server components**      | All client                               | Server + client islands           | **Skip**         | Would break real-time + auth                              | High                |
| **Flat routes/**           | Modules/ pattern                         | Flat routes/                      | **Skip**         | Current is superior                                       | —                   |
| **AWS Terraform**          | DO-only                                  | AWS + DO                          | **Skip**         | Not applicable                                            | —                   |
| **Separate API subdomain** | Same-domain                              | api.\* subdomain                  | **Skip**         | Current is simpler                                        | —                   |

## Notes

- **Keep**: 12 items — current implementation should stay as-is
- **Adapt**: 7 items — reference pattern worth adopting with modifications
- **Skip**: 8 items — not worth the risk, effort, or divergence from current domain
