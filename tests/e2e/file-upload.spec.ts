import { test, expect } from "@playwright/test";

test.describe("File Upload Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "e2e-test@example.com");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/");
  });

  test("uploads an image file", async ({ page }) => {
    await page.goto("/e2e-test-workspace/e2e-test-channel");

    // Create a test image file
    const testFile = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );

    // Click the upload button (assuming there's an attachment button)
    await page.click('button[aria-label="Attach file"]');

    // Set the file input
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: testFile,
    });

    // Wait for upload to complete and send
    await expect(page.locator("text=test.png")).toBeVisible({ timeout: 15000 });
  });

  test("uploads a text file", async ({ page }) => {
    await page.goto("/e2e-test-workspace/e2e-test-channel");

    const testFile = Buffer.from("Hello from E2E file upload test!");

    await page.click('button[aria-label="Attach file"]');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: testFile,
    });

    await expect(page.locator("text=test.txt")).toBeVisible({ timeout: 15000 });
  });
});
