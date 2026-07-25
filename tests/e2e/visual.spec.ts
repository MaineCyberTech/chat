import { test, expect } from "@playwright/test";

test.describe("Visual Snapshots", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveScreenshot("login-page.png", { fullPage: true });
  });
});
