import { describe, it, expect, vi, afterEach } from "vitest";
import { detectPlatform } from "@/lib/pwa/install-state";

describe("detectPlatform (SSR safety)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 'unknown' when navigator is undefined (prerender)", () => {
    vi.stubGlobal("navigator", undefined);
    expect(typeof navigator).toBe("undefined");
    expect(detectPlatform()).toBe("unknown");
  });

  it("detects windows from navigator.userAgent", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    });
    expect(detectPlatform()).toBe("windows");
  });

  it("detects android from navigator.userAgent", () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (Linux; Android 14)" });
    expect(detectPlatform()).toBe("android");
  });
});
