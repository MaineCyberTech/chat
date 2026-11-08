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
          // E2E runs against the standalone production build. `next start` does
          // not serve output:standalone, so prepare the static/public assets and
          // launch the generated server directly (same layout as the Dockerfile).
          command:
            "rm -rf apps/web/.next/standalone/apps/web/.next/static apps/web/.next/standalone/apps/web/public && cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static && cp -r apps/web/public apps/web/.next/standalone/apps/web/public && node apps/web/.next/standalone/apps/web/server.js",
          port: 3000,
          reuseExistingServer: true,
          timeout: 120000,
        },
      ]
    : undefined,
});
