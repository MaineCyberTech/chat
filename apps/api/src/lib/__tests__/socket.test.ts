import { describe, it, expect } from "vitest";
import { isChannelRoomMember } from "../socket.js";

// The channel:leave / typing:start / typing:stop handlers must only broadcast to a
// room the sender actually joined (membership is validated in channel:join).
describe("isChannelRoomMember", () => {
  it("recognizes a joined channel room", () => {
    expect(isChannelRoomMember(new Set(["channel:abc", "user:1"]), "abc")).toBe(true);
  });

  it("rejects a channel room that was never joined", () => {
    expect(isChannelRoomMember(new Set(["user:1"]), "abc")).toBe(false);
  });

  it("does not treat a user room as a channel room", () => {
    expect(isChannelRoomMember(new Set(["user:abc"]), "abc")).toBe(false);
  });
});
