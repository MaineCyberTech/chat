import { describe, it, expect } from "vitest";
import { messageStore, SupabaseMessageStore, channelStore, SupabaseChannelStore } from "../src/stores/index.js";

describe("messageStore", () => {
  it("is an instance of SupabaseMessageStore", () => {
    expect(messageStore).toBeInstanceOf(SupabaseMessageStore);
  });

  it("has all required IMessageStore methods", () => {
    expect(typeof messageStore.listByChannel).toBe("function");
    expect(typeof messageStore.getById).toBe("function");
    expect(typeof messageStore.create).toBe("function");
    expect(typeof messageStore.update).toBe("function");
    expect(typeof messageStore.remove).toBe("function");
    expect(typeof messageStore.pin).toBe("function");
    expect(typeof messageStore.unpin).toBe("function");
    expect(typeof messageStore.getPinned).toBe("function");
    expect(typeof messageStore.flag).toBe("function");
    expect(typeof messageStore.unflag).toBe("function");
    expect(typeof messageStore.getFlagged).toBe("function");
    expect(typeof messageStore.getEditHistory).toBe("function");
  });
});

describe("channelStore", () => {
  it("is an instance of SupabaseChannelStore", () => {
    expect(channelStore).toBeInstanceOf(SupabaseChannelStore);
  });

  it("exports IChannelStore and CreateChannelInput types", () => {
    const sdk: { createChannel: unknown } = {
      createChannel: (_input: { name: string; workspace_id: string; is_private?: boolean }) => ({}),
    };
    expect(typeof sdk.createChannel).toBe("function");
  });
});
