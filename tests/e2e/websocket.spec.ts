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

test.describe("WebSocket Connection", () => {
  const creds = loadCredentials();

  test.beforeEach(function () {
    test.skip(
      !creds,
      "Skipping: copy test-signin.example.json to test-signin.json with valid credentials at repo root",
    );
  });

  test("Socket.io connects on channel view load", async ({ page }) => {
    await login(page, creds!);
    await page.waitForURL(/\/[^/]+$/, { timeout: 30000 });

    const connected = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 10000);
        const check = () => {
          const ws = (window as any).__socket;
          if (ws && ws.connected) {
            clearTimeout(timeout);
            resolve(true);
          }
        };
        check();
        const interval = setInterval(check, 200);
        setTimeout(() => clearInterval(interval), 10000);
      });
    });

    expect(connected).toBe(true);
  });
});
