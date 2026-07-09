# Admin and Settings UX Audit

## Admin Panel (`[workspaceSlug]/admin/page.tsx`)

| Area | Issue | Severity | Why It Matters | Recommendation |
|------|-------|:--------:|----------------|----------------|
| Table layout | Card-based instead of tables (good) | PASS | Responsive on mobile | — |
| Pagination | Shows page numbers but no total item count | P3 | Users can't gauge dataset size | Add "Showing 1-20 of 150" |
| User management | No role editing, no disable action | P2 | Admin cannot manage users | Add role dropdown + disable action |
| Import | No CSV validation before submission | P2 | Users discover errors after server round-trip | Add client-side CSV validation with preview |
| Sidebar nav | Fixed 192px sidebar, not responsive on mobile | P2 | Content area unusable on phones | Convert to horizontal tabs at md breakpoint |
| Hardcoded `#fff` | Active filter tab color hardcoded | P2 | Breaks with non-standard themes | Replace with `var(--button-color)` |

## Settings Page (`[workspaceSlug]/settings/page.tsx`)

| Area | Issue | Severity | Why It Matters | Recommendation |
|------|-------|:--------:|----------------|----------------|
| Theme toggle | No live preview — waits for server confirmation | P2 | Perceptible delay in theme change | Apply theme class optimistically |
| Save button | Single button at page bottom | P3 | Users may scroll away and forget to save | Add floating save bar on unsaved changes |
| Per-channel notifications | No search/filter in channel list | P3 | 100+ channel list is unscrollable | Add channel search input |
| Clock format select | `<div>` used as label instead of `<label htmlFor>` | P3 | Screen reader can't associate label | Use `<label>` with `htmlFor` |
| Notification sound select | Same pattern | P3 | Same | Same fix |
| Trigger words input | No `<form>` wrapper — Enter handler on input | P3 | Non-standard form behavior | Wrap in `<form>` |
| Error handling | Catch blocks only log to console | P1 | Users don't see failures | Add toast notifications on failure |

## User Journey Gaps

| Journey | Step Count | Friction Points | Abandonment Risk | Recommendation |
|---------|:----------:|-----------------|:----------------:|----------------|
| Visitor → Auth | 2-3 | Login form lacks inline validation on blur | Low | Add `aria-invalid` on blur |
| New user → First message | 4-6 | Onboarding uses localStorage only, not synced | Medium | Sync onboarding progress to server |
| Returning user → Resume | 2-3 | Quick switcher has no recent channels | Low | Add recent section |
| Admin → Manage users | 3-4 | No role editing, no user search showing enough data | Medium | Add inline role editing, total count |
| Admin → Import CSV | 4-5 | No preview before import | Medium | Add CSV preview step |
| Settings → Change theme | 2 | No live preview | Low | Optimistic theme application |
