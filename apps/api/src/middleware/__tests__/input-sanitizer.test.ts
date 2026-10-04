import { describe, it, expect, vi } from "vitest";
import { inputSanitizer } from "../input-sanitizer.js";
import { AppError } from "../../lib/app-error.js";

type AnyObj = any;

vi.mock("../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function req(body: unknown, query: unknown = {}) {
  return { body, query, ip: "127.0.0.1", path: "/test" } as AnyObj;
}

describe("inputSanitizer (FEAT-P2-004)", () => {
  it("accepts ordinary prose containing SQL keywords", () => {
    const next = vi.fn();
    expect(() =>
      inputSanitizer(
        req({ name: "Select Team", description: "update the drop", search: "insert coin" }),
        {} as AnyObj,
        next,
      ),
    ).not.toThrow();
    expect(next).toHaveBeenCalledWith();
  });

  it("accepts a query string containing SQL keywords", () => {
    const next = vi.fn();
    expect(() =>
      inputSanitizer(req({}, { q: "select team" }), {} as AnyObj, next),
    ).not.toThrow();
    expect(next).toHaveBeenCalledWith();
  });

  it("still blocks script tags", () => {
    const next = vi.fn();
    expect(() =>
      inputSanitizer(req({ name: "<script>alert(1)</script>" }), {} as AnyObj, next),
    ).toThrow(AppError);
    expect(next).not.toHaveBeenCalled();
  });

  it("still blocks script tags in nested fields", () => {
    const next = vi.fn();
    expect(() =>
      inputSanitizer(
        req({ prefs: { label: "<script>alert(1)</script>" } }),
        {} as AnyObj,
        next,
      ),
    ).toThrow(AppError);
    expect(next).not.toHaveBeenCalled();
  });
});
