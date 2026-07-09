import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const CREDENTIALS_PATH = path.resolve(__dirname, "../../test-signin.json");
const HAS_CREDENTIALS = fs.existsSync(CREDENTIALS_PATH);

test.describe("Auth Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
  });

  test("renders login form with email input and submit button", async ({ page }) => {
    await expect(page.locator("#email")).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator("text=Sign in with magic link")).toBeVisible();
  });

  test("shows error for invalid email format", async ({ page }) => {
    await page.fill("#email", "invalid-email");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Please enter a valid email address")).toBeVisible();
  });

  test("shows error for empty email", async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Email is required")).toBeVisible();
  });

  test("shows sent state after successful magic link request", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("#email", "test@example.com");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Check your email")).toBeVisible({ timeout: 10000 });
  });

  test("completes full sign-in with credentials", async ({ page }) => {
    test.skip(
      !HAS_CREDENTIALS,
      "Skipping: copy test-signin.example.json to test-signin.json with valid credentials",
    );
    const raw = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
    const creds = JSON.parse(raw) as { email: string; password: string };
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("#email", creds.email);
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) await passwordInput.fill(creds.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/[^/]+$/, { timeout: 30000 });
    await expect(page.locator("text=Chat")).toBeVisible({ timeout: 10000 });
  });
});
