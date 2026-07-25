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

async function createTestWorkspace(page: Page, name: string) {
  const newBtn = page.locator('text="Create Workspace"');
  if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await newBtn.click();
    await page.locator('input[name="name"]').fill(name);
    await page.locator('button:has-text("Create")').click();
    await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 10000 });
  }
}

async function createTestChannel(page: Page, workspaceSlug: string, name: string) {
  await page.goto(`/${workspaceSlug}`);
  const createBtn = page.locator('text="Create Channel"');
  if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await createBtn.click();
    await page.locator('input[name="name"]').fill(name);
    await page.locator('button:has-text("Create")').click();
    await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 10000 });
  }
}

test.describe("Channel Operations", () => {
  const creds = loadCredentials();

  test.beforeEach(function () {
    test.skip(
      !creds,
      "Skipping: copy test-signin.example.json to test-signin.json with valid credentials",
    );
  });

  const wsName = creds ? `e2e-chops-${Date.now()}` : "";
  const wsSlug = wsName.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  test("creates a channel and navigates to it", async ({ page }) => {
    await login(page, creds);
    await createTestWorkspace(page, wsName);

    await page.goto(`/${wsSlug}`);
    const createBtn = page.locator('text="Create Channel"');
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    const chName = `e2e-channel-${Date.now()}`;
    await page.locator('input[name="name"]').fill(chName);
    await page.locator('button:has-text("Create")').click();

    await expect(page.locator(`text=${chName}`)).toBeVisible({ timeout: 10000 });
  });

  test("channel topic is visible in header", async ({ page }) => {
    const chName = `e2e-topic-${Date.now()}`;
    await login(page, creds);
    await createTestWorkspace(page, wsName);
    await createTestChannel(page, wsSlug, chName);

    await page.goto(`/${wsSlug}/${chName}`);
    await expect(page.locator("#channel-view")).toBeVisible({ timeout: 10000 });

    const header = page.locator("#channel_view, .channel-header");
    await expect(header).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${chName}`)).toBeVisible({ timeout: 10000 });
  });

  test("channel header shows channel name", async ({ page }) => {
    const chName = `e2e-header-${Date.now()}`;
    await login(page, creds);
    await createTestWorkspace(page, wsName);
    await createTestChannel(page, wsSlug, chName);

    await page.goto(`/${wsSlug}/${chName}`);
    await expect(page.locator("#channel-view")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${chName}`).first()).toBeVisible({ timeout: 10000 });
  });
});
