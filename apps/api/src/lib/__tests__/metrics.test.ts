import { describe, it, expect } from "vitest";
import { register, messagesCreatedTotal, recordMessageCreated } from "../metrics.js";

describe("metrics tenant-label hygiene (OBS-P2-002)", () => {
  it("exposes the message counter without per-tenant labels", async () => {
    recordMessageCreated();
    const output = await register.metrics();

    expect(messagesCreatedTotal).toBeDefined();
    expect(output).toContain("chat_messages_created_total");
    // Regression guard: channel_id is tenant-scoped and must never be a label.
    expect(output).not.toContain("channel_id");
  });
});
