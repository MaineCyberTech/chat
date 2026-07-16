# Playwright Test Recommendations — July 16, 2026

## Current Coverage Gaps

| Gap                                  | Status | Impact                                 |
| ------------------------------------ | ------ | -------------------------------------- |
| No axe-core a11y audit               | ❌     | Cannot catch ARIA/contrast regressions |
| No visual snapshot of main chat view | ❌     | Critical regression blind spot         |
| No focus trap tests                  | ❌     | Modal keyboard behavior unverified     |
| No interactive responsive tests      | ❌     | Breakpoint behavior unverified         |
| No mobile touch interaction tests    | ❌     | Touch targets, gestures unverified     |
| No keyboard navigation tests         | ❌     | Tab/arrow flow unverified              |
| No dark mode interaction tests       | ❌     | Theme toggle behavior unverified       |

## Recommended Test Files

### 1. `e2e/accessibility.spec.ts` — axe-core Audit

```typescript
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("channel view should have no critical a11y violations", async ({ page }) => {
  await page.goto("/workspace/channel");
  await page.waitForSelector('[role="log"]');
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations.filter((v) => v.impact === "critical").length).toBe(0);
});
```

**Pages to audit:** Login, Workspace home, Channel view, Search, Settings, Admin, 404

### 2. `e2e/focus-trap.spec.ts` — Modal Focus Management

Test all 12+ interactive surfaces:

- Emoji picker
- Quick switcher
- Profile popover
- Context menu
- Delete dialog
- Create workspace dialog
- Create channel dialog
- Invite members modal
- Status modal
- Keyboard shortcuts modal
- Notification preferences modal
- Group modal

```typescript
test("emoji picker traps focus", async ({ page }) => {
  await page.click('[aria-label="Emoji picker"]');
  await page.waitForSelector('[role="dialog"]');
  // Tab through all focusable elements — should cycle within modal
  await page.keyboard.press("Tab");
  // Verify focus is on first modal element
  await expect(page.locator(":focus")).toBeVisible();
  // Escape should close
  await page.keyboard.press("Escape");
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
});
```

### 3. `e2e/visual-snapshot-chat.spec.ts` — Main Chat View

```typescript
test("channel view visual snapshot", async ({ page }) => {
  await page.goto("/workspace/channel");
  await page.waitForSelector('[role="log"]');
  await page.waitForTimeout(1000); // Allow virtualizer to settle
  await expect(page).toHaveSapshot("channel-view-desktop.png");
});

test("channel view mobile visual snapshot", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/workspace/channel");
  await page.waitForSelector("#post-list");
  await expect(page).toHaveSapshot("channel-view-mobile.png");
});
```

### 4. `e2e/responsive.spec.ts` — Breakpoint Behavior

```typescript
test("sidebar collapses at tablet breakpoint", async ({ page }) => {
  // Desktop: sidebar visible
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/workspace/channel");
  await expect(page.locator("#SidebarContainer")).toBeVisible();

  // Tablet: sidebar auto-collapses
  await page.setViewportSize({ width: 800, height: 1024 });
  await expect(page.locator("#SidebarContainer")).toHaveClass(/collapsed/);

  // Mobile: sidebar hidden, bottom nav visible
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator("#SidebarContainer")).not.toBeVisible();
  await expect(page.locator('[role="navigation"]')).toBeVisible();
});
```

### 5. `e2e/keyboard-navigation.spec.ts` — Keyboard Flow

```typescript
test("can navigate sidebar with keyboard", async ({ page }) => {
  await page.goto("/workspace/channel");
  await page.keyboard.press("Tab"); // Focus first interactive element
  // Verify skip-to-content link appears
  await expect(page.locator("a:focus")).toContainText("Skip");

  // Ctrl+K opens quick switcher
  await page.keyboard.press("Control+k");
  await expect(page.locator('[role="dialog"]')).toBeVisible();
});
```

## Test Configuration Updates

### playwright.config.ts — Add to projects

```typescript
projects: [
  {
    name: "accessibility",
    use: { ...devices["Desktop Chrome"] },
    testMatch: "**/*.a11y.spec.ts",
  },
  {
    name: "mobile",
    use: { ...devices["iPhone 13"] },
    testMatch: "**/*.mobile.spec.ts",
  },
  {
    name: "tablet",
    use: { ...devices["iPad Pro 11"] },
    testMatch: "**/*.tablet.spec.ts",
  },
];
```

## CI Integration

Add to `ci.yml` or `validate.yml`:

```yaml
- name: Run accessibility tests
  run: pnpm test:e2e -- --project=accessibility

- name: Run visual snapshot tests
  run: pnpm test:e2e -- --project=visual --update-snapshots
  if: github.ref == 'refs/heads/develop'
```

## Summary

| Test File                    | Tests                         | Priority | CI Impact |
| ---------------------------- | ----------------------------- | -------- | --------- |
| accessibility.spec.ts        | axe-core audit of 6 key pages | Critical | ~30s      |
| focus-trap.spec.ts           | 12+ modal focus scenarios     | High     | ~45s      |
| visual-snapshot-chat.spec.ts | Main chat view regression     | High     | ~20s      |
| responsive.spec.ts           | 3 breakpoint behaviors        | Medium   | ~15s      |
| keyboard-navigation.spec.ts  | Tab/arrow/shortcut flow       | Medium   | ~30s      |
