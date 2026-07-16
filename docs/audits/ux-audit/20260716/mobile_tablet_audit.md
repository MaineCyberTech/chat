# Mobile & Tablet UX Audit — July 16, 2026

## Mobile UX (320-430px)

### Strengths

- Three-tier responsive layout (mobile/tablet/desktop) with distinct layouts
- Bottom navigation with safe-area support (`env(safe-area-inset-bottom)`)
- Dynamic viewport height via VisualViewport API (`--vh` custom property)
- `100dvh` CSS fallback via `@supports`
- Overlay sidebar at 80vw (max 320px) with backdrop
- Pull-to-refresh in message list (120px max, 60px activation)
- Always-visible action buttons on mobile (hover: none media query)
- Skip-to-content link for keyboard users

### Critical Issues

| Issue                         | Location               | Impact                                | Fix                        |
| ----------------------------- | ---------------------- | ------------------------------------- | -------------------------- |
| Admin panel tabs inaccessible | admin/page.tsx         | P1 — admins can't use panel on phones | Add tab selector dropdown  |
| Formatting bar 28px buttons   | formatting-bar.tsx     | P1 — fails 44px WCAG touch target     | Increase to 44px on mobile |
| Settings toggles 24px         | settings/page.tsx      | P2 — fails touch target               | Increase to 44px on mobile |
| Keyboard shortcuts rows 32px  | keyboard-shortcuts.tsx | P2 — below touch target               | Increase row padding       |
| Onboarding w-80 overflow      | onboarding-tour.tsx    | P2 — overflow on 320px screens        | Use max-w calc             |

### Touch Target Audit

| Component                | Current Size       | Min Required | Pass? |
| ------------------------ | ------------------ | ------------ | ----- |
| Formatting bar buttons   | 28px               | 44px         | ❌    |
| Settings toggle switches | 24px               | 44px         | ❌    |
| Keyboard shortcut rows   | ~32px              | 44px         | ❌    |
| Admin sidebar items      | ~32px              | 44px         | ❌    |
| Channel list items       | 36px (44px mobile) | 44px         | ✅    |
| Bottom nav buttons       | 44px               | 44px         | ✅    |
| Message action buttons   | 44px               | 44px         | ✅    |
| Dialog close button      | 44px               | 44px         | ✅    |

### Add Global Mobile Touch Target Rule

```css
@media (max-width: 767px) {
  .mm-button-icon,
  button:not(.btn-ignore):not(.mm-post *) {
    min-height: 44px;
    min-width: 44px;
  }
}
```

## Tablet UX (768-1024px)

### Strengths

- Sidebar auto-collapse at 768px breakpoint to 60px mini-rail
- Smooth transition via CSS transitions
- Mini-rail shows workspace icons for navigation

### Issues

| Issue                       | Location         | Impact                         | Fix                     |
| --------------------------- | ---------------- | ------------------------------ | ----------------------- |
| Admin sidebar hidden        | admin/page.tsx   | P1 — no admin on tablet either | Same mobile fix applies |
| Thread panel no fixed width | chat-view.tsx    | P2 — inconsistent layout       | Add `w-[400px]`         |
| Channel info fixed 320px    | channel-info.tsx | P2 — 42% of 768px viewport     | Use responsive width    |

### Recommendations

1. Apply same mobile admin tab fix to tablet range
2. Set thread panel to `w-[400px]` on desktop, full width on mobile
3. Channel info: `max-w-[320px] w-full` instead of fixed width
