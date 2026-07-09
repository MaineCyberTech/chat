# Responsive Viewport Matrix

## Breakpoint Strategy

**Current**: Tailwind defaults (sm:640, md:768, lg:1024) + custom `--breakpoint-lg: 1024px`. Workspace layout uses `md:` as primary toggle (768px).

**Issues**:

- No dedicated tablet breakpoint between 768-1024px
- Sidebar auto-collapses at md but user toggle is overwritten on resize events
- Landscape mobile (<480px height) nav reduced to 40px (below 44px minimum)

**Recommended Strategy**: Add tablet-specific variant (`lg` for 1024px), ensure user sidebar toggle persists across breakpoints, fix landscape nav height.

---

## Viewport Matrix

| Viewport |         Device Class         | Route/Surface    | Expected Behavior                                            | Observed Pattern                                                     | Issue                                                  | Severity | Fix                                                                        |
| :------: | :--------------------------: | ---------------- | ------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------ | :------: | -------------------------------------------------------------------------- |
|  320px   |      Mobile (iPhone SE)      | Chat view        | Message input visible, keyboard opens, bottom nav accessible | Keyboard hides input on iOS; bottom nav has no safe area padding     | iOS keyboard blocks input (P0); safe area missing (P1) |  P0/P1   | Add VisualViewport API; add safe area padding                              |
|  360px   |     Mobile (Galaxy S24)      | Chat view        | Same as above                                                | Same as above                                                        | Same as above                                          |  P0/P1   | Same as above                                                              |
|  375px   |      Mobile (iPhone 15)      | Chat view        | Same as above                                                | Same as above                                                        | Same as above                                          |  P0/P1   | Same as above                                                              |
|  414px   |     Mobile (iPhone Plus)     | Chat view        | Same as above                                                | Same as above                                                        | Same as above                                          |  P0/P1   | Same as above                                                              |
|  430px   |  Mobile (iPhone 15 Pro Max)  | Chat view        | Same as above                                                | Same as above                                                        | Same as above                                          |  P0/P1   | Same as above                                                              |
|  768px   |    Tablet (iPad portrait)    | Workspace layout | Sidebar auto-collapses; user can expand                      | Sidebar collapses correctly but user toggle is overwritten on resize | Sidebar toggle not sticky across resize events         |    P2    | Respect userToggledRef on resize; only apply auto-collapse on fresh resize |
|  810px   | Tablet (iPad 10.9" portrait) | Workspace layout | Full sidebar available but may collapse                      | Sidebar auto-collapses (md breakpoint)                               | No tablet-optimized layout                             |    P3    | Consider lg breakpoint for full sidebar on larger tablets                  |
|  1024px  |   Tablet (iPad landscape)    | Workspace layout | Full sidebar + team rail + content                           | Works correctly                                                      | —                                                      |   PASS   | —                                                                          |
|  1280px  |           Desktop            | Workspace layout | Full layout with sidebar, team rail, threads                 | Works correctly                                                      | —                                                      |   PASS   | —                                                                          |
|  1440px  |           Desktop            | Workspace layout | Comfortable reading width                                    | Works correctly                                                      | —                                                      |   PASS   | —                                                                          |
|  1920px  |           Desktop            | Workspace layout | Full width, no content stretching                            | Works correctly                                                      | —                                                      |   PASS   | —                                                                          |
|  2560px  |           Desktop            | Workspace layout | Wide layout, may benefit from max-width                      | Content may stretch too wide                                         | No max-width on content area                           |    P3    | Add `max-w-7xl` or similar to content container                            |

## Responsive-Specific Issues

|          Viewport           | Route/Component      | Issue                                                        | Severity | Fix                                               |
| :-------------------------: | -------------------- | ------------------------------------------------------------ | :------: | ------------------------------------------------- |
|         All mobile          | Chat view            | Bottom nav has no safe area bottom padding on notched phones |    P1    | Add `padding-bottom: env(safe-area-inset-bottom)` |
|         All mobile          | Workspace layout     | Mobile header has no safe area top padding                   |    P2    | Add `padding-top: env(safe-area-inset-top)`       |
| Landscape mobile (<480px h) | Workspace layout     | Bottom nav height 40px < 44px minimum touch target           |    P1    | Increase `--bottom-nav-height` to 2.75rem         |
|           <340px            | Chat emoji picker    | Fixed width 340px overflows viewport                         |    P2    | Use `width: min(340px, calc(100vw - 16px))`       |
|           <384px            | Dialog (all)         | `max-w-sm` (384px) overflows small viewports                 |    P2    | Add `mx-4` and use responsive max-width           |
|             All             | Workspace layout     | Double backdrop overlay on mobile sidebar                    |    P2    | Remove redundant backdrop in AppSidebar           |
|           Mobile            | Channel sidebar      | Channel item height 32px below touch target                  |    P2    | Increase to min 40px                              |
|           Mobile            | Various              | 10+ icon buttons below 44px minimum (24px-32px)              |    P2    | Systematically audit and increase touch targets   |
|           Mobile            | Channel context menu | Positioned at touch coordinates, can overflow viewport       |    P1    | Add boundary clamping for context menu position   |
