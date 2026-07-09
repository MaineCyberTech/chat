# Mobile and Tablet UX Audit

## Mobile UX Report

### Mobile Strengths
- Swipe-back gesture well implemented (`use-swipe-back.ts`)
- Bottom navigation with 4 key items (Back, Menu, Channels, Settings)
- Responsive sidebar overlay with 80vw width, max 320px
- `--vh` variable for viewport height calculation
- Font-size 16px on inputs to prevent iOS zoom
- Touch targets on bottom nav meet 44px minimum
- Admin data uses card layout (not tables) — inherently responsive

### Mobile Critical Issues (P0/P1)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **Keyboard hides message input on iOS** | `message-input.tsx` globally | Core messaging broken on iOS Safari — no VisualViewport API |
| 2 | **Bottom nav lacks safe area inset** | `layout.tsx` | Home indicator overlaps nav buttons on notched phones |
| 3 | **Mobile header lacks safe area top** | `layout.tsx` | Status bar/notch overlaps header content |
| 4 | **Landscape nav height 40px (<44px min)** | `globals.css` | Buttons too small, compounded by no safe area |
| 5 | **Context menu overflows viewport** | `channel-list.tsx` | Long-press menu appears off-screen near edges |

### Mobile Workflow Friction

| Workflow | Friction | Severity |
|----------|----------|:--------:|
| Send a message on iOS | Keyboard covers input — user cannot see what they type | P0 |
| Reorder sidebar categories | HTML5 drag events don't work on touch | P2 |
| Reorder channels | Same — touch drag not supported | P2 |
| Use multiple workspaces | No team switcher on mobile — requires 3 taps | P2 |
| Access context menu near screen edge | Menu overflows viewport | P1 |
| Tap sidebar channels | 32px items below 44px touch target | P2 |
| Tap small icon buttons (24px-32px) | Most UI controls below minimum touch target | P2 |

### Mobile Recommendations

1. **Add VisualViewport API** (P0) — critical for iOS keyboard handling
2. **Add safe area padding** (P1) — bottom nav + header
3. **Fix landscape nav height** (P1) — 44px minimum
4. **Clamp context menu position** (P1) — boundary detection
5. **Increase touch targets** (P2) — systematic audit of all interactive controls
6. **Add mobile workspace switcher** (P2) — icon button in bottom nav

### Mobile Redesign Opportunities

- Consider bottom sheet instead of context menu on mobile
- Add "compose" FAB for quick message creation
- Implement pull-to-refresh for message list
- Add haptic feedback for key interactions

---

## Tablet Experience Audit

| Area | Current Behavior | Issue | Recommendation |
|------|-----------------|-------|---------------|
| Sidebar | Auto-collapses at 768px; user toggle reset on resize | No persistent tablet-optimized sidebar | Use `lg` breakpoint for full sidebar; honor user toggle |
| Team rail | Hidden on tablet (`md:block` starts at 768px) | Team switching requires extra taps | Show rail in landscape tablet mode |
| Split-pane | Chat + thread panel works well | No issues | — |
| Admin pages | Sidebar nav takes 192px of limited space | Content area too narrow | Convert to horizontal tabs or collapsible nav on tablet |
| Dialog sizing | `max-w-sm` (384px) on tablet | Dialog small on 768-1024px screens | Use `max-w-md` on tablet, `max-w-sm` on mobile |
| Data density | Lists use card layout | Good for touch | — |
