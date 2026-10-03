import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
  loadEnv: vi.fn(),
}));

vi.mock("../logger.js", () => ({ logger: mocks.logger }));
vi.mock("../../config/env.js", () => ({ loadEnv: mocks.loadEnv }));

import { initSentry } from "../sentry.js";

describe("initSentry (OBS-P2-003)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("warns instead of silently skipping when SENTRY_DSN is unset", () => {
    mocks.loadEnv.mockReturnValue({ SENTRY_DSN: undefined, NODE_ENV: "test" });

    initSentry();

    expect(mocks.logger.warn).toHaveBeenCalledTimes(1);
    expect(mocks.logger.warn.mock.calls[0][0]).toContain("SENTRY_DSN");
  });
});
