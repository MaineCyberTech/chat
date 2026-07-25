import { test, expect } from "@playwright/test";

test.describe("Visual snapshots", () => {
  test.describe("Login page", () => {
    test("desktop light 1280px", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("login-desktop-light.png", { fullPage: true });
    });

    test("mobile light 375px", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("login-mobile-light.png", { fullPage: true });
    });

    test("desktop dark 1280px", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/");
      await page.evaluate(() => document.documentElement.classList.add("dark"));
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("login-desktop-dark.png", { fullPage: true });
    });
  });

  test.describe("Settings page", () => {
    test("desktop light 1280px", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/settings");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("settings-desktop-light.png", { fullPage: true });
    });

    test("mobile light 375px", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/settings");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("settings-mobile-light.png", { fullPage: true });
    });
  });

  test.describe("404 page", () => {
    test("desktop light 1280px", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/nonexistent-page-12345");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("not-found-desktop-light.png", { fullPage: true });
    });

    test("desktop dark 1280px", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/nonexistent-page-12345");
      await page.evaluate(() => document.documentElement.classList.add("dark"));
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("not-found-desktop-dark.png", { fullPage: true });
    });
  });
});
