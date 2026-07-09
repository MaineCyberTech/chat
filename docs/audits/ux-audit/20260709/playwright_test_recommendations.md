# Playwright / UI Test Recommendations

## Current Test Coverage

| Test Area                 |        Existing Coverage         | Missing Coverage              |
| ------------------------- | :------------------------------: | ----------------------------- |
| Auth flows                |        ✅ `auth.spec.ts`         | —                             |
| Navigation                |     ✅ `navigation.spec.ts`      | —                             |
| Messaging flow            |      ✅ `messaging.spec.ts`      | Thread reply, emoji reactions |
| Search                    |       ✅ `search.spec.ts`        | Search operators, filters     |
| File upload               |     ✅ `file-upload.spec.ts`     | —                             |
| Auth→Workspace→Chat       | ✅ `auth-workspace-chat.spec.ts` | —                             |
| Visual snapshots          |   ✅ `visual-snapshot.spec.ts`   | Route-level snapshots         |
| **Recommended additions** |                                  |                               |

## Recommended Test Additions

### Accessibility Tests (Axe)

```ts
// tests/e2e/a11y.spec.ts
test("login page has no a11y violations", async ({ page }) => {
  await page.goto("/login");
  await injectAxe(page);
  await checkA11y(page, null, {
    includedImpacts: ["critical", "serious"],
  });
});

test("chat view has no a11y violations", async ({ page }) => {
  await login(page);
  await page.goto("/workspace-slug/channel-id");
  await injectAxe(page);
  await checkA11y(page, null, {
    rules: { "color-contrast": { enabled: true } },
  });
});
```

### Focus Trap Tests

```ts
test("Quick Switcher traps focus", async ({ page }) => {
  await page.goto("/workspace-slug");
  await page.keyboard.press("Control+k");
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  // Tab through all focusable elements should stay within dialog
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    await expect(page.locator('[role="dialog"]')).toContain(page.locator(":focus"));
  }
  await page.keyboard.press("Escape");
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
});
```

### Keyboard Navigation Tests

```ts
test("message actions accessible via keyboard", async ({ page }) => {
  await page.goto("/workspace-slug/channel-id");
  const message = page.locator(".mm-post").first();
  await message.focus();
  // Verify action buttons become visible on focus
  await expect(message.locator(".post-menu__item")).toBeVisible();
  // Tab to reaction button
  await page.keyboard.press("Tab");
  await expect(page.locator('[aria-label="Add reaction"]')).toBeFocused();
});
```

### Responsive Viewport Matrix Tests

```ts
const viewports = [
  { width: 320, height: 568 }, // iPhone SE
  { width: 375, height: 812 }, // iPhone X
  { width: 390, height: 844 }, // iPhone 15
  { width: 768, height: 1024 }, // iPad portrait
  { width: 1024, height: 768 }, // iPad landscape
  { width: 1440, height: 900 }, // Desktop
];

for (const vp of viewports) {
  test(`chat view at ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto("/workspace-slug/channel-id");
    // Verify key elements visible
    await expect(page.locator(".post-create__container")).toBeVisible();
    await expect(page.locator("#SidebarContainer")).toBeVisible();
    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(vp.width + 1);
  });
}
```

### Visual Regression Tests

```ts
// Add to visual-snapshot.spec.ts
test("dark mode visual regression", async ({ page }) => {
  await page.goto("/workspace-slug/channel-id");
  await page.evaluate(() => {
    localStorage.setItem("chat-theme", "dark");
    document.documentElement.classList.add("dark");
  });
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot("chat-view-dark.png", {
    maxDiffPixelRatio: 0.02,
  });
});

test("mobile chat view snapshot", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/workspace-slug/channel-id");
  await expect(page).toHaveScreenshot("chat-view-mobile.png", {
    maxDiffPixelRatio: 0.02,
  });
});
```

### Form Validation Tests

```ts
test("login form shows inline validation on blur", async ({ page }) => {
  await page.goto("/login");
  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill("invalid");
  await emailInput.blur();
  await expect(page.locator('[aria-invalid="true"]')).toBeVisible();
});

test("message input disabled when empty", async ({ page }) => {
  await page.goto("/workspace-slug/channel-id");
  const sendButton = page.locator('button[aria-label="Send"]');
  await expect(sendButton).toBeDisabled();
  await page.locator(".ProseMirror").fill("Hello");
  await expect(sendButton).toBeEnabled();
});
```

### Dialog Focus Trap Tests

```ts
test("dialog focus trap maintains focus within", async ({ page }) => {
  await page.goto("/workspace-slug/channel-id");
  // Trigger delete dialog
  await page.locator('[aria-label="Delete message"]').click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  // Tab forward multiple times should stay in dialog
  const dialog = page.locator('[role="dialog"]');
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    await expect(dialog.locator(":focus")).toBeVisible();
  }
});
```

### Reduced Motion Tests

```ts
test("animations disabled with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/workspace-slug");
  // Check that animate-pulse elements have no animation
  const hasAnimation = await page.evaluate(() => {
    const el = document.querySelector(".animate-pulse");
    if (!el) return false;
    const anim = getComputedStyle(el).animation;
    return anim !== "none" && anim !== "";
  });
  expect(hasAnimation).toBe(false);
});
```

### Theme Contrast Tests

```ts
test("dark mode meets minimum contrast ratios", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/workspace-slug/channel-id");
  // Could use Puppeteer/Axe color contrast checks
  // For now this is a placeholder for manual verification
  // We could measure computed styles against WCAG thresholds
});
```

## Priority Order for Test Implementation

1. **Focus trap tests** — cover Quick Switcher, Emoji Picker, all Dialogs
2. **Keyboard navigation tests** — message actions, sidebar, quick switcher
3. **Responsive viewport matrix** — critical viewport sizes (320, 375, 768, 1440)
4. **Accessibility (Axe)** — login page, chat view, settings page
5. **Visual regression snapshots** — light + dark mode, mobile + desktop
6. **Form validation** — login, create channel, settings
7. **Reduced motion** — verify animations are suppressed
8. **Theme contrast** — automated contrast ratio checks
