with open('AGENTS.md', 'r', encoding='utf-8') as f:
    content = f.read()

old = """### Additional Fixes Applied (July 1, 2026 — Sessions 2-5)

| Finding | Severity | Files Changed |
|---|---|---|
| /metrics endpoint unauthenticated | P0 | app.ts — added authenticate middleware |
| CSP allows cdn.jsdelivr.net (broad script allowlist) | P1 | security-headers.ts — removed CDN wildcard |
| Rate limiter IP-only keys | P1 | rate-limit.ts — added user+IP composite key |
| Trivy @master mutable tag | P1 | validate.yml, build-push.yml — pinned to v0.28.0 SHA |
| pnpm audit threshold moderate | P1 | validate.yml — raised to high |
| No dependabot.yml | P1 | Created `.github/dependabot.yml` |
| CSRF missing origin/referer check | P1 | csrf.ts — added defense-in-depth origin validation |
| Missing loading.tsx/error.tsx in route groups | P2 | Created 4 files for (auth) and (workspace) groups |
| TypeScript types out of sync (soft-delete, 7 missing interfaces) | P1 | packages/db/src/types.ts — added missing fields and types |
| Missing DB indexes (10 indexes) | P2 | `migrations/20260627000001_add_missing_indexes.sql` |
| Webhook PATCH response secret leaking | P1 | webhooks/routes.ts — masked secret in PATCH response |
| Thread reply input not auto-resizing | P2 | thread-panel.tsx — added auto-resize via scrollHeight |
| Avatar uses `<img>` not Next.js `Image` | P1 | avatar-upload.tsx — switched to Next.js Image, removed console.error |
| Search results lack term highlighting | P2 | search-bar.tsx — added `highlightText()` with `<mark>` wrapper |
| No Supabase query timeout utility | P1 | Created `apps/api/src/lib/db-timeout.ts` |
| No data retention enforcement | P2 | Migration `20260627000002_enforce_data_retention.sql` (audit 90d, notif 30d, consent 1yr) |
| No worker health endpoint | P1 | worker/src/main.ts — added HTTP health server on port 4100 |
| No keyboard shortcut help | P3 | Created `keyboard-shortcuts.tsx`, added to layout |

### Resolved Issues"""

new = """### Additional Fixes Applied (July 1-2, 2026 — Sessions 2-6)

| Finding | Severity | Files Changed |
|---|---|---|
| /metrics endpoint unauthenticated | P0 | app.ts — added authenticate middleware |
| CSP allows cdn.jsdelivr.net (broad script allowlist) | P1 | security-headers.ts — removed CDN wildcard |
| Rate limiter IP-only keys | P1 | rate-limit.ts — added user+IP composite key |
| Trivy @master mutable tag | P1 | validate.yml, build-push.yml — pinned to v0.28.0 SHA |
| pnpm audit threshold moderate | P1 | validate.yml — raised to high |
| No dependabot.yml | P1 | Created `.github/dependabot.yml` |
| CSRF missing origin/referer check | P1 | csrf.ts — added defense-in-depth origin validation |
| Missing loading.tsx/error.tsx in route groups | P2 | Created 4 files for (auth) and (workspace) groups |
| TypeScript types out of sync (soft-delete, 7 missing interfaces) | P1 | packages/db/src/types.ts — added missing fields and types |
| Missing DB indexes (10 indexes) | P2 | `migrations/20260627000001_add_missing_indexes.sql` |
| Webhook PATCH response secret leaking | P1 | webhooks/routes.ts — masked secret in PATCH response |
| Thread reply input not auto-resizing | P2 | thread-panel.tsx — added auto-resize via scrollHeight |
| Avatar uses `<img>` not Next.js `Image` | P1 | avatar-upload.tsx — switched to Next.js Image, removed console.error |
| Search results lack term highlighting | P2 | search-bar.tsx — added `highlightText()` with `<mark>` wrapper |
| No Supabase query timeout utility | P1 | Created `apps/api/src/lib/db-timeout.ts` |
| No data retention enforcement | P2 | Migration `20260627000002_enforce_data_retention.sql` (audit 90d, notif 30d, consent 1yr) |
| No worker health endpoint | P1 | worker/src/main.ts — added HTTP health server on port 4100 |
| No keyboard shortcut help | P3 | Created `keyboard-shortcuts.tsx`, added to layout |
| Virtual message list | P0 | message-list.tsx, chat-view.tsx — `@tanstack/react-virtual`, cursor pagination, jump-to-present |
| Search date/author/channel filters | P1 | RPC updated, API route, frontend date/author filters |
| Optimistic UI engine | P1 | `useOptimistic` hook — temp IDs, rollback on failure, server echo dedup |
| Threaded conversations | P1 | thread_metadata/participants tables, API endpoints, participant tracking UI |
| Mention notification system | P1 | Mention parser, `resolveMentions()`, notification creation on messages |
| RBAC channel overrides | P1 | channel_role_overrides table, deny middleware, RLS for hidden channels |
| Rich text editor | P1 | Markdown preview toggle, emoji picker, drag-drop upload zone |
| Responsive layout | P2 | Tablet sidebar collapse, mobile bottom nav bar, lg breakpoint drawer |
| LiveKit WebRTC integration | P1 | Docker compose, Caddy proxy, token service, media room UI, firewall rules |

### Resolved Issues"""

if old in content:
    content = content.replace(old, new)
    with open('AGENTS.md', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated AGENTS.md successfully')
else:
    print('Could not find exact match for old section')
    # Try to find what's there
    idx = content.find('### Additional Fixes Applied')
    if idx >= 0:
        print(f'Found at position {idx}')
        print(content[idx:idx+200])
