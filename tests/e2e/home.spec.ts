import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("renders the landing page heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("MaineCyberTech Chat");
  });

  test("renders CTA buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Get Started")).toBeVisible();
    await expect(page.getByText("Learn More")).toBeVisible();
  });
});
