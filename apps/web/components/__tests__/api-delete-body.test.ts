// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { access_token: "test-token" } } })),
      signOut: vi.fn(),
    },
  }),
}));

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

import { api } from "@/lib/api";

describe("api.delete", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = "csrf_token=test-csrf";
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the account-deletion password in the DELETE body", async () => {
    await api.delete("/auth/account", { password: "correct-horse" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v1/auth/account");
    expect(init.method).toBe("DELETE");
    expect(init.body).toBe(JSON.stringify({ password: "correct-horse" }));
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
  });

  it("omits the body for passwordless magic-link deletion", async () => {
    await api.delete("/auth/account");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("DELETE");
    expect(init.body).toBeUndefined();
  });
});
