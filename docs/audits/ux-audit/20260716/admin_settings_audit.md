# Admin & Settings UX Audit — July 16, 2026

## Admin Panel (`admin/page.tsx` — 1647 lines)

### Current Features (11 tabs)

1. Overview — system stats, version
2. Users — user list, role management, search
3. Channels — channel list, management
4. Workspaces — workspace management
5. Integrations — webhooks, API keys
6. Import-Export — CSV import with preview, JSON/CSV export
7. Security — security settings
8. Audit Log — filtered event log
9. System — system configuration
10. Site Config — site-wide settings
11. Logs — server logs

### UX Issues

| Severity | Issue                           | Detail                                                 |
| -------- | ------------------------------- | ------------------------------------------------------ |
| **P1**   | Mobile navigation broken        | Sidebar `hidden md:block` — no tab switching on phones |
| **P1**   | Zero i18n                       | 150+ hardcoded strings                                 |
| **P2**   | No role-change confirmation     | User role dropdown fires immediately                   |
| **P2**   | Duplicated pagination           | Same code in 3 tabs                                    |
| **P2**   | Inline components               | StatusBadge and Card duplicated                        |
| **P3**   | Export buttons no loading state | No spinner during fetch                                |
| **P3**   | Naive CSV parser                | `line.split(",")` breaks on quoted fields              |
| **P3**   | No error boundary per tab       | One failure takes down whole panel                     |
| **P3**   | Hardcoded document.title        | Not localized                                          |

### Accessibility Issues

| Issue                    | WCAG  | Detail                              |
| ------------------------ | ----- | ----------------------------------- |
| No `role="tablist"`      | 4.1.2 | Sidebar items not semantically tabs |
| No `aria-current="page"` | 4.1.1 | Active tab not marked               |
| No keyboard arrow nav    | 2.1.1 | Tab-only — no Up/Down arrows        |

### Recommendations

1. **Mobile tab selector** — `<select>` dropdown when sidebar is hidden (P1, S effort)
2. **i18n migration** — ~150 strings to `admin.*` keys (P1, XL effort)
3. **Extract Pagination** — shared component (P2, S effort)
4. **Add role-change confirmation** — dialog before role update (P2, XS effort)
5. **Add export loading state** — disabled + spinner (P3, XS effort)
6. **Fix CSV parser** — quote-aware parsing (P3, M effort)

## Settings Page (`settings/page.tsx` — 937 lines)

### Current Features

- Appearance (theme)
- Sidebar (collapse preferences)
- Notifications (global settings)
- Auto-Responder (away message)
- Per-Channel (notification overrides)
- Danger Zone (account deletion)

### UX Issues

| Severity | Issue                | Detail                                |
| -------- | -------------------- | ------------------------------------- |
| **P1**   | Zero i18n            | 80+ hardcoded strings                 |
| **P2**   | Dual save mechanism  | Auto-save AND Save button — confusing |
| **P2**   | Language reload      | `window.location.reload()`            |
| **P3**   | "Loading..." text    | Not using Skeleton                    |
| **P3**   | No character counter | Auto-responder textarea               |
| **P3**   | No debounce          | Rapid toggles hammer API              |

### Accessibility Issues

| Issue                 | WCAG  | Detail                         |
| --------------------- | ----- | ------------------------------ |
| No focus traps        | 2.4.3 | Reset/delete confirm dialogs   |
| No `aria-describedby` | 4.1.2 | Confirmation dialogs           |
| `role="switch"`       | —     | Already used on toggle rows ✅ |

### Recommendations

1. **Add i18n** — ~80 strings to `settings.*` keys (P1, L effort)
2. **Pick one save paradigm** — auto-save with debounce (P2, S effort)
3. **Add focus traps** — to both confirmation dialogs (P2, S effort)
4. **Add character counter** — "42/500" (P3, XS effort)
5. **Extract ToggleRow** — to shared component (P3, XS effort)
