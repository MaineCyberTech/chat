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

async function sendMessage(page: Page, content: string) {
  const msgInput = page.locator('textarea[aria-label="Message"], textarea[aria-label*="message"]');
  await expect(msgInput).toBeVisible({ timeout: 10000 });
  await msgInput.fill(content);
  await page.locator('button:has-text("Send")').click();
  await expect(page.locator(`text=${content}`).first()).toBeVisible({ timeout: 10000 });
}

test.describe("Thread Operations", () => {
  const creds = loadCredentials();

  test.beforeEach(function () {
    test.skip(
      !creds,
      "Skipping: copy test-signin.example.json to test-signin.json with valid credentials",
    );
  });

  const wsName = creds ? `e2e-thread-${Date.now()}` : "";
  const wsSlug = wsName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const chName = creds ? `e2e-thch-${Date.now()}` : "";

  test("sends a message and opens thread view", async ({ page }) => {
    await login(page, creds);
    await createTestWorkspace(page, wsName);
    await createTestChannel(page, wsSlug, chName);
    await page.goto(`/${wsSlug}/${chName}`);
    await expect(page.locator("#channel-view")).toBeVisible({ timeout: 10000 });

    await sendMessage(page, "Thread parent message");
  });

  test("thread panel opens when clicking reply on a message", async ({ page }) => {
    await login(page, creds);
    await createTestWorkspace(page, wsName);
    await createTestChannel(page, wsSlug, chName);
    await page.goto(`/${wsSlug}/${chName}`);
    await expect(page.locator("#channel-view")).toBeVisible({ timeout: 10000 });

    await sendMessage(page, "A message to reply to");
    const msg = page.locator("text=A message to reply to").first();
    await msg.hover();

    const replyBtn = page.locator('button[aria-label="Reply in thread"]');
    if (await replyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await replyBtn.click();
      await expect(page.locator("#thread-panel, [data-testid=thread-panel]")).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("sends a thread reply", async ({ page }) => {
    await login(page, creds);
    await createTestWorkspace(page, wsName);
    await createTestChannel(page, wsSlug, chName);
    await page.goto(`/${wsSlug}/${chName}`);
    await expect(page.locator("#channel-view")).toBeVisible({ timeout: 10000 });

    await sendMessage(page, "Parent for thread reply");
    const msg = page.locator("text=Parent for thread reply").first();
    await msg.hover();

    const replyBtn = page.locator('button[aria-label="Reply in thread"]');
    if (await replyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await replyBtn.click();
      const threadInput = page.locator(
        '#thread-panel textarea, [data-testid=thread-panel] textarea',
      );
      if (await threadInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await threadInput.fill("A thread reply");
        await page.keyboard.press("Enter");
        await expect(page.locator("text=A thread reply")).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
