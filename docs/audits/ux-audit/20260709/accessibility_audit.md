# Accessibility Audit Report

## Standards: WCAG 2.2 Level AA

## Findings Summary

| Severity | Count | Key Issues |
|----------|-------|------------|
| P1 | 8 | Focus traps, hover-reveal keyboard access, formatting toolbar aria-pressed, profile popover focus, context menu focus, low-contrast muted text, low-contrast alpha text |
| P2 | 14 | Semantic HTML landmarks, aria-pressed on formatting, category delete on hover, drag-and-drop without keyboard alternative, resizable sidebar keyboard access, contrast for secondary text, message list aria-live pagination flood |
| P3 | 20 | Reduced motion dead code, missing role="status", reaction button aria-label, search result role conflict, autocomplete live regions, empty channel status, edited timestamp contrast, offline indicator contrast, login form aria-invalid, trigger words form, RemindModal focus trap, channel delete focus trap, etc. |

## Must-Fix (P0/P1)

| # | WCAG | Issue | Location | Fix |
|---|------|-------|----------|-----|
| 1 | 2.4.3 | Quick Switcher has no focus trap | `quick-switcher.tsx` | Add Tab focus trap on KeyDown |
| 2 | 2.4.3 | Emoji Picker has no focus trap | `emoji-picker.tsx` | Add Tab focus trap inside picker container |
| 3 | 1.4.3 | `foreground.muted` (#a3a3a3) fails AA (2.7:1) | `semantic-colors.ts` | Increase to neutral[500] (#737373) for light mode |
| 4 | 1.4.3 | `rgba(var(--center-channel-color-rgb), 0.56)` pattern fails AA (~3.2:1) | 20+ files across app | Increase alpha to 0.72 minimum |
| 5 | 2.1.1/1.4.13 | Hover-reveal post actions not keyboard accessible on desktop | `globals.css`, `message-item.tsx` | Use `visibility/opacity` with `focus-within` instead of `display: none` |
| 6 | 4.1.2 | Formatting toolbar buttons lack `aria-pressed` state | `formatting-bar.tsx` | Add `aria-pressed={editor.isActive('bold')}` etc. |
| 7 | 2.4.3 | ProfilePopover has no focus management | `profile-popover.tsx` | Auto-focus close button on open, trap Tab, return focus on close |
| 8 | 2.4.3 | MessageContextMenu has no focus management | `context-menu.tsx` | Auto-focus first menu item, arrow key navigation |

## Recommended Enhancements

| Area | Enhancement | Effort |
|------|------------|--------|
| Reduced motion | Fix dead `data-reduced-motion` attribute script or add CSS selectors | XS |
| Screen reader | Add `role="status"` to empty channel message | XS |
| Forms | Add `aria-invalid` prop to Input on validation error | S |
| Forms | Wrap message input in `<form>` for landmark + form semantics | M |
| Navigation | Add `<nav aria-label="Workspace navigation">` to sidebar | XS |
| Autocomplete | Add `aria-live="polite"` to mention/emoji/slash autocomplete dropdowns | S |
| Focus management | Add focus traps to RemindModal, channel delete dialog, notification dropdown | M |
| Alt text | Pass `alt={authorName}` to Avatar in message items | XS |
| Reaction buttons | Add `aria-label` alongside `title` for reaction counts | XS |
| Search results | Fix `role="option"` on `<Link>` role conflict | XS |

## Nice-to-Haves

| Area | Enhancement | Effort |
|------|------------|--------|
| Search | Add `aria-setsize`/`aria-posinset` to search user results | S |
| Toast | Add `role="status"` as secondary role for older AT | XS |
| Keyboard | Add ArrowUp/ArrowDown navigation between context menu items | S |
| Keyboard | Add keyboard reorder for drag-and-drop categories/channels | L |
| Keyboard | Add keyboard resize for sidebar (ArrowLeft/ArrowRight) | M |
