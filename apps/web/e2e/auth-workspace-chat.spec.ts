import { test, expect, Page } from "@playwright/test";

const TEST_EMAIL = "e2e-test@example.com";
const TEST_WORKSPACE_NAME = "E2E Test Workspace";

async function signIn(page: Page) {
  await page.goto("/");
  await page.click("text=Sign in");
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.click('button:has-text("Send magic link")');
  // In test environment, we'd mock the email or use a test account
  // For now, we'll just verify the flow reaches this point
}

async function createWorkspace(page: Page) {
  await page.click("text=Add workspace");
  await page.fill('label:has-text("Name") + input', TEST_WORKSPACE_NAME);
  await page.click('button:has-text("Create")');
  await expect(page.locator(`text=${TEST_WORKSPACE_NAME}`)).toBeVisible({ timeout: 10000 });
}

async function sendMessage(page: Page) {
  await page.fill('textarea[placeholder*="message" i]', "Hello E2E test!");
  await page.keyboard.press("Enter");
  await expect(page.locator("text=Hello E2E test!")).toBeVisible({ timeout: 5000 });
}

test.describe("Full auth → workspace → chat flow", () => {
  test("sign in → create workspace → send message", async ({ page }) => {
    // Note: This test requires a test Supabase project with email auth enabled
    // and a test user. In CI, we would use a mock Supabase or test project.

    await signIn(page);
    await createWorkspace(page);
    await sendMessage(page);
  });
});

test.describe("Workspace creation and listing", () => {
  test("created workspace appears in list", async ({ page: _page }) => {
    // This test verifies the workspace creation + member trigger works
    // Requires authenticated session
    test.skip(true, "Requires Supabase test project setup");
  });
});

test.describe("API endpoint tests", () => {
  test("POST /v1/workspaces creates workspace and member", async ({ request: _request }) => {
    // This would test the API directly with a valid token
    test.skip(true, "Requires Supabase test project setup");
  });
});
