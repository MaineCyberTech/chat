// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import { MessageList } from "../message-list";
import type { Message, UserProfile } from "@chat/db";
import type { Reaction } from "../message-list/message-item";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn().mockResolvedValue({ reactions: {} }),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@chat/ui", () => ({
  EmptyState: ({ description }: { description?: string }) => (
    <div data-testid="empty-state">{description}</div>
  ),
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("lucide-react", () => ({
  Reply: () => null,
  Pencil: () => null,
  X: () => null,
  Smile: () => null,
  Bookmark: () => null,
  AlertCircle: () => null,
  AlertTriangle: () => null,
}));

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: (opts: { count: number }) => ({
    getTotalSize: () => opts.count * 60,
    getVirtualItems: () =>
      Array.from({ length: opts.count }, (_, i) => ({
        index: i,
        start: i * 60,
        size: 60,
        key: i,
      })),
    scrollToIndex: () => {},
    measureElement: () => {},
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("MessageList", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockProfiles = new Map<string, UserProfile>([
    ["user1", { id: "user1", email: "user1@test.com", display_name: "User One" }],
    ["user2", { id: "user2", email: "user2@test.com", display_name: "User Two" }],
  ]);

  function makeMessage(overrides: Partial<Message> & { id: string }): Message {
    return {
      channel_id: "ch1",
      user_id: "user1",
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

  it("renders list of messages", () => {
    render(
      <MessageList
        messages={[makeMessage({ id: "msg1", content: "Hello World" })]}
        profiles={mockProfiles}
      />,
    );
    expect(screen.getByText("Hello World")).toBeDefined();
  });

  it("shows empty state when no messages", () => {
    render(<MessageList messages={[]} profiles={mockProfiles} />);
    expect(screen.getByText(/no messages yet/i)).toBeDefined();
  });

  it("shows author name for each message", () => {
    render(
      <MessageList
        messages={[makeMessage({ id: "msg1", user_id: "user1" })]}
        profiles={mockProfiles}
      />,
    );
    expect(screen.getByText("User One")).toBeDefined();
  });

  it("shows timestamp for each message", () => {
    const date = new Date("2026-07-05T14:30:00Z");
    render(
      <MessageList
        messages={[makeMessage({ id: "msg1", created_at: date.toISOString() })]}
        profiles={mockProfiles}
      />,
    );
    expect(screen.getAllByText(/10:30/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows date separators between messages on different days", () => {
    const today = new Date("2026-07-05T12:00:00Z");
    const yesterday = new Date("2026-07-04T12:00:00Z");
    render(
      <MessageList
        messages={[
          makeMessage({ id: "msg1", content: "Old", created_at: yesterday.toISOString() }),
          makeMessage({ id: "msg2", content: "New", created_at: today.toISOString() }),
        ]}
        profiles={mockProfiles}
      />,
    );
    const dateStr = today.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    expect(screen.getByText(dateStr)).toBeDefined();
  });

  it("renders reactions when present", async () => {
    const reactions: Reaction[] = [
      {
        id: "r1",
        message_id: "msg1",
        user_id: "user2",
        emoji: "👍",
      },
    ];
    const { api } = await import("@/lib/api");
    vi.mocked(api.get).mockResolvedValue({ reactions: { msg1: reactions } });

    render(
      <MessageList
        messages={[makeMessage({ id: "msg1" })]}
        currentUserId="user1"
        profiles={mockProfiles}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("👍")).toBeDefined();
    });
  });

  it("calls onLoadOlder when scrolled to top", async () => {
    const onLoadOlder = vi.fn();
    const messages = Array.from({ length: 5 }, (_, i) =>
      makeMessage({ id: `msg${i}`, content: `Message ${i}` }),
    );

    render(
      <MessageList
        messages={messages}
        profiles={mockProfiles}
        onLoadOlder={onLoadOlder}
        hasMoreOlder={true}
        loadingOlder={false}
      />,
    );

    const container = document.querySelector("#post-list");
    if (container) {
      Object.defineProperty(container, "scrollTop", {
        value: 0,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(container, "scrollHeight", {
        value: 2000,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(container, "clientHeight", {
        value: 500,
        writable: true,
        configurable: true,
      });
      fireEvent.scroll(container);
    }

    await waitFor(() => {
      expect(onLoadOlder).toHaveBeenCalled();
    });
  });
});
