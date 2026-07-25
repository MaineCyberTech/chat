import { test, expect, type Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const CREDENTIALS_PATH = path.resolve(__dirname, "../../test-signin.json");
const HAS_CREDENTIALS = fs.existsSync(CREDENTIALS_PATH);

interface TestCredentials {
  email: string;
  password: string;
}

function loadCredentials(): TestCredentials | null {
  if (!HAS_CREDENTIALS) return null;
  try {
    const raw = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
    return JSON.parse(raw) as TestCredentials;
  } catch {
    return null;
  }
}

async function login(page: Page, creds: TestCredentials) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(creds.email);
  const passwordInput = page.locator('input[type="password"]');
  if (await passwordInput.isVisible()) {
    await passwordInput.fill(creds.password);
  }
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/[^/]+$/, { timeout: 30000 });
}

test.describe("Admin Panel", () => {
  const creds = loadCredentials();

  test.beforeEach(function () {
    test.skip(
      !creds,
      "Skipping: copy test-signin.example.json to test-signin.json with valid credentials",
    );
  });

  test.beforeEach(async ({ page }) => {
    await login(page, creds);
  });

  test("loads admin page and displays stats", async ({ page }) => {
    const wsSlug = page.url().match(/\/([^/]+)$/)?.[1] ?? "";
    await page.goto(`/${wsSlug}/admin`);
    await expect(page.locator("text=Admin Panel")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Statistics")).toBeVisible({ timeout: 5000 });
  });

  test("user list renders on admin page", async ({ page }) => {
    const wsSlug = page.url().match(/\/([^/]+)$/)?.[1] ?? "";
    await page.goto(`/${wsSlug}/admin`);
    await expect(page.locator("text=Users")).toBeVisible({ timeout: 10000 });
  });

  test("admin tabs are navigable", async ({ page }) => {
    const wsSlug = page.url().match(/\/([^/]+)$/)?.[1] ?? "";
    await page.goto(`/${wsSlug}/admin`);
    await expect(page.locator("text=Admin Panel")).toBeVisible({ timeout: 10000 });
    const overviewTab = page.locator("text=Overview");
    if (await overviewTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await overviewTab.click();
      await expect(page.locator("text=Statistics")).toBeVisible({ timeout: 5000 });
    }
  });
});
