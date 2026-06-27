import { test, expect } from "@playwright/test";

test.describe("Search Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "e2e-test@example.com");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/");
    await page.goto("/e2e-test-workspace/e2e-test-channel");
  });

  test("shows search bar in channel view", async ({ page }) => {
    await expect(page.locator('input[aria-label="Search messages"]')).toBeVisible();
  });

  test("returns results for matching messages", async ({ page }) => {
    await page.fill('input[aria-label="Search messages"]', "Hello");
    await expect(page.locator("text=Hello from E2E test!")).toBeVisible({ timeout: 10000 });
  });

  test("shows empty state for no matches", async ({ page }) => {
    await page.fill('input[aria-label="Search messages"]', "xyznonexistent");
    await expect(page.locator("text=No messages found")).toBeVisible({ timeout: 10000 });
  });
});
