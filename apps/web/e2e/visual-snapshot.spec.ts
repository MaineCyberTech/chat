import { test, expect } from "@playwright/test";

test.describe("Visual snapshots", () => {
  test.describe("Login page", () => {
    test("desktop 1280px", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("login-desktop.png", { fullPage: true });
    });

    test("mobile 375px", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("login-mobile.png", { fullPage: true });
    });
  });

  test.describe("Settings page", () => {
    test("desktop 1280px", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/settings");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("settings-desktop.png", { fullPage: true });
    });

    test("mobile 375px", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/settings");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("settings-mobile.png", { fullPage: true });
    });
  });

  test.describe("404 page", () => {
    test("desktop 1280px", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/nonexistent-page-12345");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("not-found-desktop.png", { fullPage: true });
    });
  });
});
