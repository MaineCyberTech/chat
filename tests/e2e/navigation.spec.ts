import { test, expect } from "@playwright/test";

test.describe("Channel Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "e2e-test@example.com");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/");
  });

  test("displays channel list in sidebar", async ({ page }) => {
    await page.goto("/e2e-test-workspace");
    await expect(page.locator('[aria-label="Channel list"]')).toBeVisible();
  });

  test("navigates to channel and shows messages", async ({ page }) => {
    await page.goto("/e2e-test-workspace");
    await page.click("text=e2e-test-channel");
    await expect(page.locator('[aria-label="Message input"]')).toBeVisible({ timeout: 10000 });
  });
});
