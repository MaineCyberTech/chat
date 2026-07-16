# Responsive Viewport Matrix — July 16, 2026

## Tested Viewports

| Category         | Width  | Device            | Status                                                      |
| ---------------- | ------ | ----------------- | ----------------------------------------------------------- |
| Mobile small     | 320px  | iPhone SE         | ⚠️ Onboarding tour w-80 overflows; formatting bar too small |
| Mobile standard  | 375px  | iPhone 13/14      | ⚠️ Admin nav broken, formatting bar 28px                    |
| Mobile large     | 414px  | iPhone Plus/Max   | ⚠️ Admin nav broken                                         |
| Mobile max       | 430px  | iPhone 16 Pro Max | ⚠️ Admin nav broken                                         |
| Tablet portrait  | 768px  | iPad              | ✅ Sidebar auto-collapses to 60px mini-rail                 |
| Tablet landscape | 1024px | iPad              | ✅ Full sidebar restored                                    |
| Small desktop    | 1280px | Standard laptop   | ✅ Full layout                                              |
| Desktop          | 1440px | Standard desktop  | ✅ Full layout                                              |
| Wide             | 1920px | Desktop           | ✅ Full layout                                              |
| Ultra-wide       | 2560px | Large monitor     | ✅ Content max-width contained                              |

## Breakpoint Strategy

| Breakpoint | Current Behavior                                                    | Issue                                             | Recommendation                                   |
| ---------- | ------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| <768px     | Mobile: overlay sidebar, fixed bottom nav, hidden desktop sidebar   | Admin nav broken; formatting toolbar small        | Add mobile admin tab nav; increase touch targets |
| 768-1024px | Tablet: sidebar auto-collapses to 60px mini-rail, smooth transition | Admin sidebar also hidden — no tablet alternative | Add same tab selector for tablet admin           |
| >=1024px   | Desktop: full sidebar + team rail                                   | None                                              | OK                                               |

## Issues by Viewport

### 320-430px (Mobile)

- Admin panel: tab navigation completely inaccessible (sidebar `hidden md:block`)
- Formatting bar: 28px buttons fail 44px WCAG touch target
- Settings: toggle switches at 24px fail touch target
- Keyboard shortcuts: rows at 32px fail touch target
- Onboarding tour: `w-80` (320px) may overflow on 320px screens
- Channel info: fixed 320px width fills entire screen

### 768-1024px (Tablet)

- Thread panel: no fixed width — behavior depends on content
- Admin sidebar hidden (same as mobile) — should show mini-rail
- Channel info sidebar at 320px takes 42% of 768px screen — may be too dominant

### 1024px+ (Desktop)

- No issues identified — layouts perform as expected
- Thread panel should have consistent 400px width
- Max content width well-contained at 1028px for message input

## Safe Area Handling

| Feature                                                 | Status                              |
| ------------------------------------------------------- | ----------------------------------- |
| `env(safe-area-inset-bottom)` on bottom nav             | ✅ Implemented                      |
| `env(safe-area-inset-top)` on mobile header             | ✅ Implemented                      |
| Dynamic viewport height (`--vh` via VisualViewport API) | ✅ Implemented                      |
| `100dvh` CSS fallback                                   | ✅ Via `@supports (height: 100dvh)` |

## Recommendations

1. **Add mobile admin tab selector** — highest priority responsive fix
2. **Add `min-h-[44px]` media query** for all touch targets below 768px
3. **Make channel-info width responsive** — use `max-w-[320px] w-full` instead of fixed `320`
4. **Add tablet-specific admin nav** — show icon-only sidebar or horizontal tabs
5. **Set explicit thread panel width** — `w-[400px]` with responsive override
6. **Fix onboarding tour overflow** — use `max-w-[calc(100vw-24px)]` on small screens
