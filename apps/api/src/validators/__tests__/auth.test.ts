import { describe, it, expect } from "vitest";
import { updatePresenceStatusSchema } from "../auth.js";

describe("updatePresenceStatusSchema (API-P2-004)", () => {
  it("accepts a valid status and custom status", () => {
    const parsed = updatePresenceStatusSchema.safeParse({
      status: "away",
      customStatus: "In a meeting",
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.customStatus).toBe("In a meeting");
  });

  it("trims the custom status", () => {
    const parsed = updatePresenceStatusSchema.safeParse({ customStatus: "  hi  " });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.customStatus).toBe("hi");
  });

  it("rejects an unknown status", () => {
    expect(updatePresenceStatusSchema.safeParse({ status: "busy" }).success).toBe(false);
  });

  it("rejects an oversized custom status", () => {
    expect(updatePresenceStatusSchema.safeParse({ customStatus: "x".repeat(101) }).success).toBe(
      false,
    );
  });

  it("rejects control characters in the custom status", () => {
    expect(
      updatePresenceStatusSchema.safeParse({ customStatus: "bad\u0000status" }).success,
    ).toBe(false);
  });

  it("accepts absent or null custom status", () => {
    expect(updatePresenceStatusSchema.safeParse({ status: "online" }).success).toBe(true);
    expect(updatePresenceStatusSchema.safeParse({ customStatus: null }).success).toBe(true);
  });
});
