import { test, expect } from "@playwright/test";

test.describe("Auth Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders login form with email input and submit button", async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator("text=Sign in with magic link")).toBeVisible();
  });

  test("shows error for invalid email format", async ({ page }) => {
    await page.fill('input[type="email"]', "invalid-email");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Please enter a valid email")).toBeVisible();
  });

  test("shows error for empty email", async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Email is required")).toBeVisible();
  });

  test("shows sent state after successful magic link request", async ({ page }) => {
    // Use a test email that won't actually send
    await page.fill('input[type="email"]', "test@example.com");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Check your email")).toBeVisible({ timeout: 10000 });
  });
});
