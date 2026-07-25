import { test, expect } from "@playwright/test";
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

test.describe("Visual Snapshots", () => {
  const creds = loadCredentials();

  test.beforeEach(function () {
    test.skip(
      !creds,
      "Skipping: copy test-signin.example.json to test-signin.json with valid credentials at repo root",
    );
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveScreenshot("login-page.png", { fullPage: true });
  });
});
