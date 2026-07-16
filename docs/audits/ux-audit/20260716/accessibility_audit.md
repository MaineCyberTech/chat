# Accessibility Audit — July 16, 2026

## Compliance Level

**WCAG 2.2 AA target**: Not fully met. 12 WCAG violations identified. 8 additional best-practice gaps.

## Must-Fix List (WCAG Violations)

| ID     | WCAG                    | Location             | Issue                                                 | Fix                                             |
| ------ | ----------------------- | -------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| UX-102 | 4.1.2 Name, Role, Value | search-bar.tsx       | Missing `aria-activedescendant` on autocomplete input | Add attribute pointing to highlighted option id |
| UX-107 | 2.4.3 Focus Order       | settings/page.tsx    | Confirmation dialogs lack focus trap — Tab escapes    | Add full focus cycling                          |
| UX-204 | 4.1.2 Name, Role, Value | search-bar.tsx       | Type dropdown lacks `role="listbox"`                  | Add listbox role + option roles                 |
| UX-205 | 4.1.3 Status Messages   | search/page.tsx      | Results container lacks `aria-live="polite"`          | Add live region                                 |
| UX-207 | 2.4.7 Focus Visible     | formatting-bar.tsx   | No visible focus ring on toolbar buttons              | Add `focus-visible:ring-2`                      |
| UX-103 | 2.5.8 Target Size       | formatting-bar.tsx   | 28px buttons < 44px minimum                           | Increase touch targets                          |
| UX-214 | 4.1.3 Status Messages   | All error boundaries | Error states lack `role="alert"`                      | Add alert role                                  |
| UX-215 | 4.1.2 Name, Role, Value | All loading states   | No `aria-busy="true"` or `role="status"`              | Add to containers                               |
| UX-218 | 4.1.2 Name, Role, Value | onboarding-tour.tsx  | No `role="dialog"`, no `aria-modal`                   | Add dialog role                                 |
| UX-219 | 4.1.2 Name, Role, Value | cookie-banner.tsx    | No `aria-modal="true"`                                | Add aria-modal                                  |
| UX-220 | 4.1.2 Name, Role, Value | channel-info.tsx     | Tab bar missing `role="tablist"`/`aria-selected`      | Add tab ARIA                                    |
| UX-306 | 4.1.3 Status Messages   | login-form.tsx       | Status container lacks `aria-live`                    | Add live region                                 |

## Recommended Enhancements

| ID     | Location                           | Issue                                          | Fix                                |
| ------ | ---------------------------------- | ---------------------------------------------- | ---------------------------------- |
| UX-206 | formatting-bar.tsx                 | No arrow-key navigation                        | Implement WAI-ARIA toolbar pattern |
| UX-212 | keyboard-shortcuts.tsx             | Ctrl shown on macOS                            | Detect platform, swap modifiers    |
| UX-213 | keyboard-shortcuts.tsx             | No filtered results announcement               | Add `aria-live="polite"`           |
| UX-208 | formatting-bar.tsx                 | `aria-pressed` undefined on non-toggle buttons | Use `aria-haspopup="dialog"`       |
| UX-228 | globals.css                        | Dark mode text-secondary hardcoded             | Use alpha variable                 |
| UX-304 | login-form.tsx                     | No password strength indicator                 | Add requirements                   |
| UX-307 | notification-preferences-modal.tsx | No unsaved-changes warning                     | Add dirty state detection          |

## Nice-to-Haves

| ID     | Location       | Issue                     | Fix                |
| ------ | -------------- | ------------------------- | ------------------ |
| UX-310 | search-bar.tsx | Clear all no confirmation | Add confirm dialog |
| UX-309 | search-bar.tsx | Hardcoded year            | Use dynamic year   |

## Keyboard Navigation Coverage

| Feature                    | Status     | Notes                             |
| -------------------------- | ---------- | --------------------------------- |
| Skip to content            | ✅         | Present in root layout            |
| Tab order in modals        | ⚠️ Partial | Some modals lack full focus traps |
| Arrow-key toolbar nav      | ❌         | formatting-bar uses Tab only      |
| Ctrl+K quick switcher      | ✅         | Full keyboard nav                 |
| Arrow keys in autocomplete | ✅         | Mentions, emoji, slash commands   |
| Escape to close modals     | ✅         | All modals support Escape         |
| Arrow keys in sidebar      | ✅         | Category reorder up/down          |
| Resizable sidebar          | ✅         | ArrowLeft/ArrowRight + Enter      |
| Space/Enter to activate    | ✅         | All interactive elements          |

## Screen Reader Coverage

| Feature                              | Status | Notes                          |
| ------------------------------------ | ------ | ------------------------------ |
| `role="log"` on message list         | ✅     | ChatView includes this         |
| `aria-live="polite"` on message list | ✅     | Present                        |
| `role="alert"` on errors             | ❌     | Not on all error boundaries    |
| `aria-describedby` on dialogs        | ⚠️     | Some, not all                  |
| `aria-label` on icon buttons         | ⚠️     | Most, but verify new additions |

## Automated Testing Recommendation

Add `@axe-core/playwright` to the Playwright E2E pipeline:

```typescript
import { injectAxe, checkA11y } from "axe-playwright";

test("channel view should have no a11y violations", async ({ page }) => {
  await page.goto("/workspace/channel");
  await injectAxe(page);
  const results = await checkA11y(page, undefined, {
    includedImpacts: ["critical", "serious"],
  });
  expect(results.violations.length).toBe(0);
});
```

Add this to `apps/web/e2e/` and run in CI as part of the validate workflow.
