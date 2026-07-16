# Quick Wins — July 16, 2026

## Effort: XS (<30 min each)

| Quick Win                                 | ID     | Impact             | Effort | Files                   | Instructions                                                     |
| ----------------------------------------- | ------ | ------------------ | ------ | ----------------------- | ---------------------------------------------------------------- |
| Add `aria-activedescendant` to search-bar | UX-102 | High (P1 a11y)     | XS     | search-bar.tsx          | Link input to highlighted option id on arrow key navigation      |
| Add focus ring to formatting bar          | UX-207 | Medium (P2 a11y)   | XS     | formatting-bar.tsx      | Add `focus-visible:ring-2` to toolbar buttons                    |
| Add `role="alert"` to error boundaries    | UX-214 | Medium (P2 a11y)   | XS     | 6 error.tsx files       | Add `role="alert"` + `aria-live="assertive"` to error containers |
| Add `aria-busy="true"` to loading states  | UX-215 | Medium (P2 a11y)   | XS     | 5 loading.tsx files     | Add `aria-busy="true"` + `role="status"`                         |
| Fix workspace skeleton on mobile          | UX-217 | Medium (P2 mobile) | XS     | (workspace)/loading.tsx | Add `hidden md:flex` to sidebar skeleton                         |
| Add Mac modifier detection                | UX-212 | Medium (P2 a11y)   | XS     | keyboard-shortcuts.tsx  | Detect `navigator.platform` for Ctrl→⌘ swap                      |
| Dynamic year in operator hint             | UX-309 | Low (P3)           | XS     | search-bar.tsx          | Replace `2025` with `new Date().getFullYear()`                   |
| Fix admin stat grid on mobile             | UX-224 | Low (P3)           | XS     | admin/page.tsx          | Change `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`             |
| Remove dead CSS property                  | UX-319 | Low (P3)           | XS     | app-sidebar.tsx         | Remove `gridArea: "team-sidebar"`                                |
| Fix encoding artifact                     | UX-320 | Low (P3)           | XS     | app-sidebar.tsx         | Fix line 581 checkmark encoding                                  |

## Effort: S (1-3 hours each)

| Quick Win                                 | ID         | Impact           | Effort | Files                               | Instructions                                     |
| ----------------------------------------- | ---------- | ---------------- | ------ | ----------------------------------- | ------------------------------------------------ |
| Add mobile admin tab selector             | UX-101     | High (P1 admin)  | S      | admin/page.tsx                      | Add `<select>` dropdown for tab switching <768px |
| Focus trap in settings confirm dialogs    | UX-107     | High (P2 a11y)   | S      | settings/page.tsx                   | Add focus cycling in reset/delete dialogs        |
| Fix channel-info silent catch             | UX-108     | High (P1 state)  | S      | channel-info.tsx                    | Add error state with retry button                |
| Replace root/auth spinners with skeletons | UX-216     | Medium (P2 UX)   | S      | app/loading.tsx, (auth)/loading.tsx | Replace spinner with layout skeleton             |
| Add `role="listbox"` to search surfaces   | UX-204/205 | Medium (P2 a11y) | S      | search-bar.tsx, search/page.tsx     | Add listbox role, option role to dropdowns       |
| Add tab ARIA to channel-info              | UX-220     | Medium (P2 a11y) | S      | channel-info.tsx                    | role=tablist, role=tab, aria-selected            |
| Add actionable empty states               | UX-221     | Medium (P2 UX)   | S      | channel-info.tsx                    | Invite members, Pin a message buttons            |

## Total Quick Win Sprint

**Estimated time: 1 developer-day** for all XS items (10 items × 30 min)
**Estimated time: 2 developer-days** for S items (7 items × 2 hours)

**Total: ~3 days** to resolve 17 issues across 12 files.
