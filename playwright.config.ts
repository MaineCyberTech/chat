import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  snapshotDir: "./tests/e2e/__snapshots__",
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  expect: {
    toHaveScreenshot: { maxDiffPixels: 100 },
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: process.env.CI
    ? [
        {
          command: "pnpm --filter web dev",
          port: 3000,
          reuseExistingServer: true,
          timeout: 60000,
        },
      ]
    : undefined,
});
