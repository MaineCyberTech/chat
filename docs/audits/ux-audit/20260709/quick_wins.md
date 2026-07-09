# Quick Wins — Low Effort, High Impact

| Quick Win                                         | Impact                                         | Effort | Files/Components                                                                                             |
| ------------------------------------------------- | ---------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| Fix dark mode CSS variable overrides              | Dark mode works end-to-end                     | XS     | `apps/web/app/globals.css` — add `.dark` section redefining all Mattermost-style vars                        |
| Remove redundant AppSidebar backdrop              | Fixes double-dark overlay on mobile sidebar    | XS     | `apps/web/components/workspace/app-sidebar.tsx` lines 483-489                                                |
| Fix stale closure in message input `handleSubmit` | Priority values reflect on send                | XS     | `apps/web/components/chat/message-input.tsx` line 515 deps array                                             |
| Fix empty `useEffect` in error page               | Error is logged for debugging                  | XS     | `apps/web/app/error.tsx` line 13                                                                             |
| Add `aria-pressed` to formatting toolbar buttons  | Screen readers know toggle state               | XS     | `apps/web/components/chat/formatting-bar.tsx`                                                                |
| Add `role="status"` to empty channel message      | Screen readers announce empty state            | XS     | `apps/web/components/chat/message-list.tsx`                                                                  |
| Fix bot nav safe area bottom padding              | Bottom buttons usable on notched phones        | XS     | `apps/web/app/(workspace)/layout.tsx`                                                                        |
| Fix mobile header safe area top padding           | Header content not obscured by notch           | XS     | `apps/web/app/(workspace)/layout.tsx`                                                                        |
| Add `aria-describedby` to Dialog component        | Screen readers announce dialog body context    | XS     | `packages/ui/src/components/dialog.tsx`                                                                      |
| Replace hardcoded `#fff` with CSS variables       | Theme-aware colors for buttons + active states | S      | 5 files: `search/page.tsx`, `admin/page.tsx`, `user-picker-modal.tsx`, `message-input.tsx`, `login-form.tsx` |
| Fix landscape bottom nav height (40px -> 44px)    | Touch targets meet minimum on landscape mobile | XS     | `apps/web/app/globals.css` line 235                                                                          |
| Add notification save error feedback              | Users know when preference save fails          | XS     | `apps/web/components/chat/notification-preferences-modal.tsx` line 59                                        |
| Remove dead `@supports (100dvh)` CSS              | Simplify confusing dead code                   | XS     | `apps/web/app/globals.css` lines 244-248                                                                     |
| Add `htmlFor`/`id` to search date labels          | Screen readers associate labels with inputs    | XS     | `apps/web/components/chat/search-bar.tsx` lines 572-631                                                      |
| Fix settings `<label>` elements (div -> label)    | Screen readers associate labels with selects   | XS     | `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`                                                 |

## Effort Key

- **XS**: <30 minutes
- **S**: 1-2 hours
- **M**: 2-4 hours
- **L**: 1-2 days
- **XL**: 3+ days
