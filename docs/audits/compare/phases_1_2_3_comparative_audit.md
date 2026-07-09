# Phases 1-3: Comparative Audit — Mattermost vs Chat

**Date**: July 8, 2026
**Mattermost**: `C:\temp\mattermost-master` (v11.9.0)
**Chat**: `C:\temp\chat`
**Auditor**: opencode DeepSeek V4 Flash

---

## Executive Summary

| Metric             | Mattermost                    | Chat                              | Verdict                   |
| ------------------ | ----------------------------- | --------------------------------- | ------------------------- |
| **Language**       | Go + JS/TS                    | TypeScript (unified)              | Chat — one language stack |
| **Frontend**       | Redux + SASS + Webpack        | Next.js 15 + Tailwind + Turborepo | Chat — modern, fast       |
| **Backend**        | Monolithic Go (1000+ files)   | Modular Express TS (24 modules)   | Chat — navigable          |
| **DB**             | MySQL + Postgres              | Supabase (Postgres + RLS)         | Chat — managed, secure    |
| **Real-time**      | Raw Go WebSocket              | Socket.io + Redis                 | Chat — robust             |
| **Workers**        | Custom Go scheduler (47 jobs) | BullMQ (6 processors)             | Chat — resilient          |
| **Plugins**        | Full SDK + marketplace        | Webhook/API-based                 | MM — extensible           |
| **CI/CD**          | 41 workflows (build-focused)  | 20 workflows (audit-focused)      | Different focus           |
| **i18n**           | 68 locales                    | 1 locale                          | MM — global-ready         |
| **Auth**           | Custom auth + GitLab OAuth    | Supabase Auth + Google/GitHub     | Chat — managed            |
| **Infra**          | Manual setup                  | Terraform IaC                     | Chat — reproducible       |
| **Migrations**     | Forward only                  | Forward + rollback                | Chat — safer              |
| **Audit pipeline** | None                          | 20 hardening workflows            | Chat — security-first     |

## Key Findings (Phases 1-2)

### Folder Coverage

- 65% folder-for-folder mapping between repos
- Chat has **no equivalent** for: plugins, enterprise tier, CLI tools, admin console UI, MFA, image proxy
- Mattermost has **no equivalent** for: Terraform IaC, rollback migrations, PWA, BFF layer, store abstraction, hardening pipeline, chaos testing, SDK package, Storybook

### Feature Coverage

- ~60% feature parity on core messaging features
- Chat leads in: UX polish (pinning, forwarding, custom status, formatting toolbar), security (RLS, audit pipeline, middleware stack), infra (IaC, rollback, resilience)
- MM leads in: extensibility (plugins, bots, slash commands), administrative UI, localization, integrations (OAuth apps, LDAP, SAML)

## Key Recommendations (Phase 3)

### Top 5 Quick Wins (COPY)

1. Add `/msg` and `/join` slash commands
2. Add scroll-to-bottom toast
3. Add channel intro/welcome message
4. Add search operator hints
5. Add post-deleted undo toast

### Top 5 Adaptations (ADAPT)

1. Expand i18n to 5+ locales
2. Add MFA via Supabase Auth
3. Add admin console UI (Next.js routes)
4. Add channel drag-to-category reorder
5. Add draft management page

### Top 5 Don't-Copy (SKIP)

1. Plugin system — goes against Chat's SaaS architecture
2. Redux — Chat's hooks/context is simpler
3. SASS — Tailwind is maintainable and consistent
4. Go backend — TypeScript unification is a strength
5. MySQL support — Postgres-only simplifies everything

---

## Detailed Reports

| Phase                           | File                                                 |
| ------------------------------- | ---------------------------------------------------- |
| Phase 1: Deep Inventory         | `docs/audits/compare/phase1_inventory.md`            |
| Phase 2: Feature Mapping        | `docs/audits/compare/phase2_feature_mapping.md`      |
| Phase 3: Strengths & Weaknesses | `docs/audits/compare/phase3_strengths_weaknesses.md` |
