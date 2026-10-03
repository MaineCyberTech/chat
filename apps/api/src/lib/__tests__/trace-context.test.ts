import { describe, it, expect } from "vitest";
import {
  formatTraceparent,
  newTraceContext,
  parseTraceparent,
  resolveTraceContext,
} from "../trace-context.js";

const VALID = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";

describe("trace-context", () => {
  describe("newTraceContext", () => {
    it("generates sampled 32/16 hex ids", () => {
      const ctx = newTraceContext();
      expect(ctx.traceId).toMatch(/^[0-9a-f]{32}$/);
      expect(ctx.spanId).toMatch(/^[0-9a-f]{16}$/);
      expect(ctx.sampled).toBe(true);
    });
  });

  describe("parseTraceparent", () => {
    it("parses a valid traceparent and preserves the trace id and sampled flag", () => {
      const ctx = parseTraceparent(VALID);
      expect(ctx).not.toBeNull();
      expect(ctx?.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
      expect(ctx?.sampled).toBe(true);
      expect(ctx?.spanId).toMatch(/^[0-9a-f]{16}$/);
    });

    it("honours the not-sampled flag", () => {
      const ctx = parseTraceparent(
        "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00",
      );
      expect(ctx?.sampled).toBe(false);
    });

    it("accepts a case-insensitive header with surrounding whitespace", () => {
      const ctx = parseTraceparent(`  ${VALID.toUpperCase()}  `);
      expect(ctx?.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
    });

    it("accepts forward-compatible future versions", () => {
      const ctx = parseTraceparent(
        "01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
      );
      expect(ctx?.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
    });

    it.each([
      ["missing", undefined],
      ["empty", ""],
      ["malformed", "not-a-traceparent"],
      ["invalid ff version", "ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"],
      ["all-zero trace id", "00-00000000000000000000000000000000-00f067aa0ba902b7-01"],
      ["all-zero span id", "00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01"],
      ["too long", `${VALID}-extra`],
    ])("rejects %s", (_name, value) => {
      expect(parseTraceparent(value as string | undefined)).toBeNull();
    });
  });

  describe("formatTraceparent", () => {
    it("round-trips trace id and sampled flag", () => {
      const formatted = formatTraceparent(newTraceContext());
      const parsed = parseTraceparent(formatted);
      expect(parsed).not.toBeNull();
      expect(formatted).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
    });
  });

  describe("resolveTraceContext", () => {
    it("continues a valid inbound trace", () => {
      expect(resolveTraceContext(VALID).traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
    });

    it("starts a new trace when the header is absent", () => {
      expect(resolveTraceContext(undefined).traceId).toMatch(/^[0-9a-f]{32}$/);
    });

    it("starts a new trace when the header is an array", () => {
      expect(resolveTraceContext([VALID]).traceId).toMatch(/^[0-9a-f]{32}$/);
    });
  });
});
