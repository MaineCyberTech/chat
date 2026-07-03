with open('AGENTS.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = None
end = None
for i, line in enumerate(lines):
    if '### Additional Fixes Applied' in line:
        start = i
    if start is not None and i > start and '### Resolved Issues' in line:
        end = i
        break

if start is not None and end is not None:
    new_block = """### Additional Fixes Applied (July 1-2, 2026 \u2014 Sessions 2-6)

| Finding | Severity | Files Changed |
|---|---|---|
| /metrics endpoint unauthenticated | P0 | app.ts \u2014 added authenticate middleware |
| CSP allows cdn.jsdelivr.net (broad script allowlist) | P1 | security-headers.ts \u2014 removed CDN wildcard |
| Rate limiter IP-only keys | P1 | rate-limit.ts \u2014 added user+IP composite key |
| Trivy @master mutable tag | P1 | validate.yml, build-push.yml \u2014 pinned to v0.28.0 SHA |
| pnpm audit threshold moderate | P1 | validate.yml \u2014 raised to high |
| No dependabot.yml | P1 | Created `.github/dependabot.yml` |
| CSRF missing origin/referer check | P1 | csrf.ts \u2014 added defense-in-depth origin validation |
| Missing loading.tsx/error.tsx in route groups | P2 | Created 4 files for (auth) and (workspace) groups |
| TypeScript types out of sync | P1 | packages/db/src/types.ts \u2014 added missing fields and 7 new types |
| Missing DB indexes (10 indexes) | P2 | `migrations/20260627000001_add_missing_indexes.sql` |
| Webhook PATCH response secret leaking | P1 | webhooks/routes.ts \u2014 masked secret in PATCH response |
| Thread reply input not auto-resizing | P2 | thread-panel.tsx \u2014 added auto-resize via scrollHeight |
| Avatar uses `<img>` not Next.js `Image` | P1 | avatar-upload.tsx \u2014 switched to Next.js Image |
| Search results lack term highlighting | P2 | search-bar.tsx \u2014 added `highlightText()` with `<mark>` wrapper |
| No Supabase query timeout utility | P1 | Created `apps/api/src/lib/db-timeout.ts` |
| No data retention enforcement | P2 | Migration `20260627000002_enforce_data_retention.sql` |
| No worker health endpoint | P1 | worker/src/main.ts \u2014 added HTTP health server on port 4100 |
| No keyboard shortcut help | P3 | Created `keyboard-shortcuts.tsx`, added to layout |
| Virtual message list | P0 | message-list.tsx, chat-view.tsx \u2014 `@tanstack/react-virtual`, cursor pagination |
| Search date/author/channel filters | P1 | RPC, API, frontend \u2014 date_from, date_to, author_id, channel_ids |
| Optimistic UI engine | P1 | `useOptimistic` hook \u2014 temp IDs, rollback, server echo dedup |
| Threaded conversations | P1 | thread_metadata/participants tables, API endpoints, participant tracking |
| Mention notification system | P1 | Mention parser, `resolveMentions()`, notification creation on send |
| RBAC channel overrides | P1 | channel_role_overrides table, deny middleware, RLS hidden channels |
| Rich text editor | P1 | Markdown preview, emoji picker, drag-drop upload zone |
| Responsive layout | P2 | Tablet sidebar collapse, mobile bottom nav, lg breakpoint |
| LiveKit WebRTC integration | P1 | Docker compose, Caddy proxy, token service, media room UI, firewall rules |

"""

    # Replace lines from start to end (excluding the '### Resolved Issues' line)
    new_lines = new_block.splitlines(keepends=True)
    lines = lines[:start] + new_lines + lines[end:]

    with open('AGENTS.md', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(f'Replaced lines {start+1} to {end}')
else:
    print(f'start={start}, end={end}')
