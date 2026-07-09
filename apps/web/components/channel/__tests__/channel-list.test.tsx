// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { ChannelList } from "../channel-list";
import { api } from "@/lib/api";
import type { Channel } from "@chat/db";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@chat/ui", () => ({
  useToast: () => ({ addToast: vi.fn() }),
  Skeleton: ({ className, ...props }: Record<string, unknown>) =>
    React.createElement("div", { "data-testid": "skeleton", className, ...props }),
}));

vi.mock("@/components/auth/auth-context", () => ({
  useAuth: () => ({
    user: { id: "user1", email: "user1@test.com" },
  }),
}));

vi.mock("lucide-react", () => ({
  Trash2: () => null,
  Hash: () => null,
  Lock: () => null,
  GripVertical: () => null,
  Link2: () => null,
  Copy: () => null,
  ExternalLink: () => null,
  Bookmark: () => null,
  Bell: () => null,
  BellOff: () => null,
  LogOut: () => null,
  CheckCheck: () => null,
}));

vi.mock("next/link", () => {
  const MockLink = (props: Record<string, unknown>) =>
    React.createElement("a", props, props.children as React.ReactNode);
  MockLink.displayName = "Link";
  return { default: MockLink };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function makeChannel(overrides: Partial<Channel> & { id: string; name: string }): Channel {
  return {
    workspace_id: "ws1",
    slug: overrides.name.toLowerCase().replace(/\s+/g, "-"),
    topic: null,
    is_private: false,
    channel_type: "public",
    sort_order: 0,
    created_by: "user1",
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("ChannelList", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows loading skeleton while fetching", () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    render(<ChannelList workspaceSlug="ws1" workspaceId="ws1" />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("renders channels from API response", async () => {
    const channels = [
      makeChannel({ id: "ch1", name: "general" }),
      makeChannel({ id: "ch2", name: "random" }),
    ];
    vi.mocked(api.get).mockResolvedValue({ channels });

    render(<ChannelList workspaceSlug="ws1" workspaceId="ws1" />);

    await waitFor(() => {
      expect(screen.getByText("general")).toBeDefined();
      expect(screen.getByText("random")).toBeDefined();
    });
  });

  it("shows empty state when no channels", async () => {
    vi.mocked(api.get).mockResolvedValue({ channels: [] });

    render(<ChannelList workspaceSlug="ws1" workspaceId="ws1" />);

    await waitFor(() => {
      expect(screen.getByText("No channels yet")).toBeDefined();
    });
  });

  it("highlights active channel", async () => {
    const channels = [makeChannel({ id: "ch1", name: "general" })];
    vi.mocked(api.get).mockResolvedValue({ channels });

    render(<ChannelList workspaceSlug="ws1" workspaceId="ws1" activeChannelId="ch1" />);

    await waitFor(() => {
      const option = screen.getByRole("option", { selected: true });
      expect(option).toBeDefined();
    });
  });

  it("shows unread indicator", async () => {
    const channels = [makeChannel({ id: "ch1", name: "general" })];
    vi.mocked(api.get).mockResolvedValue({ channels });

    const unreads = new Map<string, { count: number; mentions: number }>();
    unreads.set("ch1", { count: 5, mentions: 2 });

    render(
      <ChannelList workspaceSlug="ws1" workspaceId="ws1" activeChannelId="ch2" unreads={unreads} />,
    );

    await waitFor(() => {
      expect(screen.getByText("2")).toBeDefined();
    });
  });

  it("shows unread channels filter when showUnreads is true", async () => {
    const channels = [
      makeChannel({ id: "ch1", name: "general" }),
      makeChannel({ id: "ch2", name: "random" }),
    ];
    vi.mocked(api.get).mockResolvedValue({ channels });

    const unreadChannels = new Set<string>(["ch1"]);

    render(
      <ChannelList
        workspaceSlug="ws1"
        workspaceId="ws1"
        showUnreads={true}
        unreadChannels={unreadChannels}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("general")).toBeDefined();
      expect(screen.queryByText("random")).toBeNull();
    });
  });

  it("shows no unread channels message when showUnreads and none match", async () => {
    const channels = [makeChannel({ id: "ch1", name: "general" })];
    vi.mocked(api.get).mockResolvedValue({ channels });

    const unreadChannels = new Set<string>();

    render(
      <ChannelList
        workspaceSlug="ws1"
        workspaceId="ws1"
        showUnreads={true}
        unreadChannels={unreadChannels}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("No unread channels")).toBeDefined();
    });
  });
});
