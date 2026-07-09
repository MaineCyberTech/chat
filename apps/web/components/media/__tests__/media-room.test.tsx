// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn() },
}));

vi.mock("@livekit/components-react", () => ({
  LiveKitRoom: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="livekit-room">{children}</div>
  ),
  VideoConference: () => <div data-testid="video-conference" />,
  ControlBar: () => <div data-testid="control-bar" />,
}));

vi.mock("@livekit/components-styles", () => ({}));

import { MediaRoom } from "../media-room";

describe("MediaRoom", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows loading spinner while fetching token", () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    const { container } = render(<MediaRoom roomName="test-room" onLeave={vi.fn()} />);
    expect(container.querySelector(".animate-spin")).toBeDefined();
  });

  it("shows error state when token fetch fails", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("Network error"));
    render(<MediaRoom roomName="test-room" onLeave={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Failed to connect to media server")).toBeDefined();
    });
  });

  it("renders LiveKit room when token is received", async () => {
    vi.mocked(api.get).mockResolvedValue({
      token: "test-token",
      wsUrl: "wss://test.livekit.io",
      roomName: "test-room",
    });
    render(<MediaRoom roomName="test-room" onLeave={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId("livekit-room")).toBeDefined();
    });
  });

  it("renders video conference and control bar in LiveKit room", async () => {
    vi.mocked(api.get).mockResolvedValue({
      token: "test-token",
      wsUrl: "wss://test.livekit.io",
      roomName: "test-room",
    });
    render(<MediaRoom roomName="test-room" onLeave={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId("video-conference")).toBeDefined();
      expect(screen.getByTestId("control-bar")).toBeDefined();
    });
  });

  it("calls onLeave when close button is clicked in error state", async () => {
    const onLeave = vi.fn();
    vi.mocked(api.get).mockRejectedValue(new Error("Network error"));
    render(<MediaRoom roomName="test-room" onLeave={onLeave} />);
    await waitFor(() => {
      expect(screen.getByText("Close")).toBeDefined();
    });
    screen.getByText("Close").click();
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("calls api.get with correct room parameter", () => {
    const getMock = vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    render(<MediaRoom roomName="custom-room" onLeave={vi.fn()} />);
    expect(getMock).toHaveBeenCalledWith("/livekit/token?room=custom-room");
  });
});
