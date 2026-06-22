# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> Homepage >> renders the landing page heading
- Location: tests\e2e\home.spec.ts:4:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  |
  3  | test.describe("Homepage", () => {
  4  |   test("renders the landing page heading", async ({ page }) => {
> 5  |     await page.goto("/");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  6  |     await expect(page.locator("h1")).toHaveText("Chat Platform");
  7  |   });
  8  |
  9  |   test("renders CTA buttons", async ({ page }) => {
  10 |     await page.goto("/");
  11 |     await expect(page.getByText("Get Started")).toBeVisible();
  12 |     await expect(page.getByText("Learn More")).toBeVisible();
  13 |   });
  14 | });
  15 |
```
