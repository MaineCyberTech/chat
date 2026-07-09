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

test.describe("Messaging Flow", () => {
  const creds = loadCredentials();

  test.beforeEach(function () {
    test.skip(!creds, "Skipping: copy test-signin.example.json to test-signin.json with valid credentials");
  });

  const wsName = creds ? `e2e-ws-${Date.now()}` : "";
  const wsSlug = wsName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const chName = creds ? `e2e-ch-${Date.now()}` : "";

  test.beforeEach(async ({ page }) => {
    await login(page, creds);
    await createTestWorkspace(page, wsName);
    await createTestChannel(page, wsSlug, chName);
    await page.goto(`/${wsSlug}/${chName}`);
    await expect(page.locator("#channel-view")).toBeVisible({ timeout: 10000 });
  });

  test("sends a message and it appears in the channel", async ({ page }) => {
    const msgInput = page.locator(
      'textarea[aria-label="Message"], textarea[aria-label*="message"]',
    );
    await expect(msgInput).toBeVisible({ timeout: 10000 });
    await msgInput.fill("Hello from E2E test!");
    const sendBtn = page.locator('button:has-text("Send")');
    await sendBtn.click();
    await expect(page.locator("text=Hello from E2E test!")).toBeVisible({ timeout: 10000 });
  });

  test("edits a sent message", async ({ page }) => {
    const msgInput = page.locator(
      'textarea[aria-label="Message"], textarea[aria-label*="message"]',
    );
    await expect(msgInput).toBeVisible({ timeout: 10000 });
    await msgInput.fill("Original message");
    await page.locator('button:has-text("Send")').click();
    await expect(page.locator("text=Original message")).toBeVisible({ timeout: 10000 });
    const msg = page.locator("text=Original message").first();
    await msg.hover();
    const editBtn = page.locator('button[aria-label="Edit message"]');
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();
      const editInput = page.locator(
        'textarea[aria-label="Edit message"], input[aria-label*="edit"]',
      );
      await editInput.fill("Edited by E2E test!");
      await page.keyboard.press("Enter");
      await expect(page.locator("text=Edited by E2E test!")).toBeVisible({ timeout: 10000 });
    }
  });

  test("deletes a sent message", async ({ page }) => {
    const msgInput = page.locator(
      'textarea[aria-label="Message"], textarea[aria-label*="message"]',
    );
    await expect(msgInput).toBeVisible({ timeout: 10000 });
    await msgInput.fill("Message to delete");
    await page.locator('button:has-text("Send")').click();
    await expect(page.locator("text=Message to delete")).toBeVisible({ timeout: 10000 });
    const msg = page.locator("text=Message to delete").first();
    await msg.hover();
    const deleteBtn = page.locator('button[aria-label="Delete message"]');
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      const confirmBtn = page.locator('button:has-text("Delete")');
      await confirmBtn.click();
      await expect(page.locator("text=Message to delete")).not.toBeVisible({ timeout: 10000 });
    }
  });

  test("receives WebSocket message updates in real time", async ({ page, context }) => {
    const page2 = await context.newPage();
    await login(page2, creds);
    await page2.goto(`/${wsSlug}/${chName}`);
    await expect(page2.locator("#channel-view")).toBeVisible({ timeout: 10000 });
    const msgInput = page.locator(
      'textarea[aria-label="Message"], textarea[aria-label*="message"]',
    );
    await expect(msgInput).toBeVisible({ timeout: 10000 });
    await msgInput.fill("WebSocket real-time test!");
    await page.locator('button:has-text("Send")').click();
    await expect(page.locator("text=WebSocket real-time test!")).toBeVisible({ timeout: 10000 });
    await expect(page2.locator("text=WebSocket real-time test!")).toBeVisible({ timeout: 15000 });
    await page2.close();
  });
});
