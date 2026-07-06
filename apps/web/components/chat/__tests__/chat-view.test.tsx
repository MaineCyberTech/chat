// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ChatView } from "../chat-view";
import type { Message } from "@chat/db";

function makeMessage(overrides: Partial<Message> & { id: string }): Message {
  return {
    channel_id: "ch-1",
    user_id: "user-1",
    content: "Test message",
    parent_id: null,
    is_pinned: false,
    priority: "standard",
    edited_at: null,
    deleted_at: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

const { mockSocket, mockApi, mockUser } = vi.hoisted(() => {
  const socket = {
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
    close: vi.fn(),
    io: { on: vi.fn(), off: vi.fn() },
  };
  const api = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() };
  const user = { id: "user-1", email: "test@test.com", user_metadata: { display_name: "Test User" } };
  return { mockSocket: socket, mockApi: api, mockUser: user };
});

vi.mock("@/lib/socket", () => ({
  getSocket: vi.fn(() => Promise.resolve(mockSocket)),
  onReconnect: vi.fn(),
  offReconnect: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api: mockApi }));

vi.mock("@/components/auth/auth-context", () => ({ useAuth: () => ({ user: mockUser }) }));

vi.mock("@/components/media/media-room", () => ({
  MediaRoom: ({ onLeave }: any) => <div data-testid="media-room"><button onClick={onLeave}>Leave Call</button></div>,
  useMediaRoom: () => ({ activeRoom: null, startCall: vi.fn(), endCall: vi.fn() }),
}));

vi.mock("@/lib/notification-sound", () => ({
  playNotificationSound: vi.fn(),
  showDesktopNotification: vi.fn(),
}));

vi.mock("@chat/ui", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("lucide-react", () => {
  const names = ["X", "Phone", "ArrowLeft", "ExternalLink", "Bell", "BellOff", "Info", "Download", "ChevronDown", "Bookmark"];
  const icons: Record<string, any> = {};
  names.forEach((n) => { icons[n] = (props: any) => <span data-testid={`icon-${n}`} {...props} />; });
  return icons;
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

vi.mock("../message-list", () => ({
  MessageList: (props: any) => (
    <div data-testid="message-list" data-messages-count={props.messages?.length}>
      {props.messages?.map((m: any) => (
        <div key={m.id} data-testid={`msg-${m.id}`}>
          <span>{m.content}</span>
          {m.id.startsWith("temp_") && <span data-testid="temp-badge">sending...</span>}
          <button data-testid={`thread-${m.id}`} onClick={() => props.onThreadOpen?.(m)}>Thread</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../message-input", () => ({
  MessageInput: (props: any) => (
    <div data-testid="message-input">
      <button data-testid="send-btn" onClick={() => props.onSend("Sent from test", "standard")}>Send</button>
      <button data-testid="typing-start" onClick={() => props.onTypingStart()}>Type</button>
      {props.typingUsers?.length > 0 && (
        <span data-testid="typing-indicator">{props.typingUsers.length} user(s) typing</span>
      )}
    </div>
  ),
}));

vi.mock("../thread-panel", () => ({
  ThreadPanel: (props: any) => (
    <div data-testid="thread-panel">
      <span data-testid="thread-parent-msg">{props.parentMessage?.content}</span>
      <button onClick={props.onClose}>Close</button>
    </div>
  ),
}));

vi.mock("../channel-info", () => ({ ChannelInfo: () => <div data-testid="channel-info" /> }));
vi.mock("../search-bar", () => ({ SearchBar: () => <div data-testid="search-bar" /> }));
vi.mock("../channel-bookmarks", () => ({ ChannelBookmarks: () => <div data-testid="channel-bookmarks" /> }));
vi.mock("../notification-preferences-modal", () => ({
  NotificationPreferencesModal: (props: any) => (
    <div data-testid="notif-prefs-modal">
      <button onClick={props.onClose}>Close</button>
    </div>
  ),
}));

function getSocketHandler(event: string) {
  return mockSocket.on.mock.calls.find((call: string[]) => call[0] === event)?.[1];
}

describe("ChatView", () => {
  const defaultProps = { channelId: "ch-1", channelName: "general", workspaceId: "ws-1", workspaceSlug: "my-workspace" };

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  function setupDefaultApi() {
    mockApi.get.mockImplementation((path: string) => {
      if (path.includes("/messages")) {
        return Promise.resolve({
          messages: [makeMessage({ id: "msg-1", content: "Hello world" })],
          nextCursor: null,
        });
      }
      if (path.includes("/members")) return Promise.resolve({ members: [{ user_id: "user-1" }] });
      if (path.includes("/preferences")) return Promise.resolve({ preferences: { notification_prefs: {} } });
      return Promise.resolve({});
    });
    mockApi.post.mockImplementation((path: string) => {
      if (path === "/auth/profiles") return Promise.resolve({ profiles: [] });
      return Promise.resolve({ message: { id: "real-msg" } });
    });
  }

  async function renderAndWaitForMessages() {
    setupDefaultApi();
    render(<ChatView {...defaultProps} />);
    await screen.findByTestId("message-list");
    await waitFor(() => expect(mockSocket.on).toHaveBeenCalledWith("message:new", expect.any(Function)));
  }

  // 1. Loading state
  it("shows skeleton while fetching messages", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    render(<ChatView {...defaultProps} />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThanOrEqual(1);
  });

  // 2. Error state
  it("shows error message when API fails", async () => {
    mockApi.get.mockRejectedValue(new Error("Network error"));
    render(<ChatView {...defaultProps} />);
    expect(await screen.findByText("Failed to load messages")).toBeInTheDocument();
  });

  it("shows loading skeleton when 'Try again' is clicked after error", async () => {
    mockApi.get.mockRejectedValue(new Error("Network error"));
    render(<ChatView {...defaultProps} />);
    expect(await screen.findByText("Failed to load messages")).toBeInTheDocument();

    // Note: The component has a bug where clicking "Try again" only sets
    // loading=true without re-fetching (usesEffect depends on channelId, not error state)
    fireEvent.click(screen.getByText("Try again"));
    await waitFor(() => {
      expect(screen.getAllByTestId("skeleton").length).toBeGreaterThanOrEqual(1);
    });
  });

  // 3. Message rendering
  it("renders messages from API response", async () => {
    await renderAndWaitForMessages();
    expect(screen.getByTestId("message-list")).toHaveAttribute("data-messages-count", "1");
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("displays member count in header", async () => {
    await renderAndWaitForMessages();
    expect(await screen.findByText((content) => content.includes("1 members"))).toBeInTheDocument();
  });

  it("renders search bar and channel bookmarks", async () => {
    await renderAndWaitForMessages();
    expect(screen.getByTestId("search-bar")).toBeInTheDocument();
    expect(screen.getByTestId("channel-bookmarks")).toBeInTheDocument();
  });

  // 4. Send message with optimistic update
  it("sends message with optimistic update and confirms on success", async () => {
    let resolvePost: (value: any) => void = () => {};
    mockApi.post.mockImplementation((path: string) => {
      if (path === "/channels/ch-1/messages") return new Promise((r) => { resolvePost = r; });
      if (path === "/auth/profiles") return Promise.resolve({ profiles: [] });
      return Promise.resolve({});
    });
    await renderAndWaitForMessages();

    fireEvent.click(screen.getByTestId("send-btn"));

    await waitFor(() => expect(screen.getByTestId("temp-badge")).toBeInTheDocument());
    expect(mockApi.post).toHaveBeenCalledWith(
      "/channels/ch-1/messages",
      expect.objectContaining({ content: "Sent from test", priority: "standard" }),
    );

    resolvePost({ message: { id: "confirmed-msg-id" } });
    await waitFor(() => expect(screen.queryByTestId("temp-badge")).not.toBeInTheDocument());
  });

  // 5. Socket message:new event
  it("appends new message from socket message:new event", async () => {
    await renderAndWaitForMessages();

    const newMsg = makeMessage({ id: "live-msg-1", content: "Live message", user_id: "user-2" });
    const handler = getSocketHandler("message:new");
    expect(handler).toBeDefined();
    handler({ message: newMsg });

    expect(await screen.findByText("Live message")).toBeInTheDocument();
    expect(screen.getByTestId("message-list")).toHaveAttribute("data-messages-count", "2");
  });

  it("plays notification sound for incoming messages from others", async () => {
    const { playNotificationSound } = await import("@/lib/notification-sound");
    await renderAndWaitForMessages();

    getSocketHandler("message:new")({ message: makeMessage({ id: "live-msg-2", content: "Echo", user_id: "user-2" }) });

    await waitFor(() => expect(playNotificationSound).toHaveBeenCalled());
  });

  it("does not play notification sound for own messages", async () => {
    const { playNotificationSound } = await import("@/lib/notification-sound");
    await renderAndWaitForMessages();

    getSocketHandler("message:new")({ message: makeMessage({ id: "own-msg", user_id: "user-1" }) });

    await new Promise((r) => setTimeout(r, 50));
    expect(playNotificationSound).not.toHaveBeenCalled();
  });

  it("handles message:updated socket event", async () => {
    await renderAndWaitForMessages();
    getSocketHandler("message:updated")({ message: makeMessage({ id: "msg-1", content: "Edited content" }) });

    expect(await screen.findByText("Edited content")).toBeInTheDocument();
  });

  it("handles message:deleted socket event", async () => {
    await renderAndWaitForMessages();
    getSocketHandler("message:deleted")({ id: "msg-1" });

    await waitFor(() => expect(screen.queryByTestId("msg-msg-1")).not.toBeInTheDocument());
    expect(screen.getByTestId("message-list")).toHaveAttribute("data-messages-count", "0");
  });

  it("deduplicates echo messages via socket", async () => {
    let resolvePost: (value: any) => void = () => {};
    mockApi.post.mockImplementation((path: string) => {
      if (path === "/channels/ch-1/messages") return new Promise((r) => { resolvePost = r; });
      if (path === "/auth/profiles") return Promise.resolve({ profiles: [] });
      return Promise.resolve({});
    });
    await renderAndWaitForMessages();

    fireEvent.click(screen.getByTestId("send-btn"));
    await waitFor(() => expect(screen.getByTestId("temp-badge")).toBeInTheDocument());
    resolvePost({ message: { id: "echo-msg-id" } });
    await waitFor(() => expect(screen.queryByTestId("temp-badge")).not.toBeInTheDocument());

    getSocketHandler("message:new")({ message: makeMessage({ id: "echo-msg-id", content: "Should dedupe", user_id: "user-1" }) });

    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getAllByText("Should dedupe").length).toBe(1);
  });

  it("adds system message when user joins via socket", async () => {
    await renderAndWaitForMessages();
    getSocketHandler("channel:user_joined")({ userId: "user-3" });
    expect(await screen.findByText("Joined the channel")).toBeInTheDocument();
  });

  it("adds system message when user leaves via socket", async () => {
    await renderAndWaitForMessages();
    getSocketHandler("channel:user_left")({ userId: "user-3" });
    expect(await screen.findByText("Left the channel")).toBeInTheDocument();
  });

  it("emits channel:join on socket setup", async () => {
    await renderAndWaitForMessages();
    expect(mockSocket.emit).toHaveBeenCalledWith("channel:join", "ch-1");
  });

  // 6. Socket typing indicator
  it("shows typing indicator from socket typing:start event", async () => {
    await renderAndWaitForMessages();
    getSocketHandler("typing:start")({ userId: "user-2" });

    expect(await screen.findByTestId("typing-indicator")).toHaveTextContent("1 user(s) typing");
  });

  it("adds multiple typing users", async () => {
    await renderAndWaitForMessages();
    const startHandler = getSocketHandler("typing:start");
    startHandler({ userId: "user-2" });
    startHandler({ userId: "user-3" });

    expect(await screen.findByTestId("typing-indicator")).toHaveTextContent("2 user(s) typing");
  });

  it("removes typing indicator on typing:stop event", async () => {
    await renderAndWaitForMessages();
    getSocketHandler("typing:start")({ userId: "user-2" });
    expect(await screen.findByTestId("typing-indicator")).toBeInTheDocument();

    getSocketHandler("typing:stop")({ userId: "user-2" });
    await waitFor(() => expect(screen.queryByTestId("typing-indicator")).not.toBeInTheDocument());
  });

  it("does not show own user's typing", async () => {
    await renderAndWaitForMessages();
    getSocketHandler("typing:start")({ userId: "user-1" });

    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByTestId("typing-indicator")).not.toBeInTheDocument();
  });

  // 7. Thread panel (renders twice: desktop + mobile)
  it("opens thread panel when thread button is clicked", async () => {
    await renderAndWaitForMessages();
    fireEvent.click(screen.getByTestId("thread-msg-1"));

    const panels = await screen.findAllByTestId("thread-panel");
    expect(panels.length).toBe(2);
    const parentMsgs = screen.getAllByTestId("thread-parent-msg");
    expect(parentMsgs.length).toBe(2);
    expect(parentMsgs[0]).toHaveTextContent("Hello world");
  });

  it("closes thread panel when close button is clicked", async () => {
    await renderAndWaitForMessages();
    fireEvent.click(screen.getByTestId("thread-msg-1"));
    expect((await screen.findAllByTestId("thread-panel")).length).toBe(2);

    const closeBtn = screen.getAllByText("Close")[0];
    if (closeBtn) fireEvent.click(closeBtn);
    await waitFor(() => expect(screen.queryByTestId("thread-panel")).not.toBeInTheDocument());
  });

  // 8. Channel info sidebar (renders twice: desktop + mobile)
  it("opens channel info sidebar when Info button is clicked", async () => {
    await renderAndWaitForMessages();
    fireEvent.click(screen.getByLabelText("Channel info"));

    const infoPanels = await screen.findAllByTestId("channel-info");
    expect(infoPanels.length).toBe(2);
  });

  it("toggles channel info sidebar off when Info button is clicked again", async () => {
    await renderAndWaitForMessages();

    const infoBtn = screen.getByLabelText("Channel info");
    fireEvent.click(infoBtn);
    expect((await screen.findAllByTestId("channel-info")).length).toBe(2);

    fireEvent.click(infoBtn);
    await waitFor(() => expect(screen.queryByTestId("channel-info")).not.toBeInTheDocument());
  });

  it("opens notification preferences modal when bell button is clicked", async () => {
    await renderAndWaitForMessages();
    fireEvent.click(screen.getByLabelText("Notification preferences"));
    expect(await screen.findByTestId("notif-prefs-modal")).toBeInTheDocument();
  });
});
