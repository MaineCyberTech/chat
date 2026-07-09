// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceList } from "../workspace-list";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@chat/ui", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
  EmptyState: ({ description }: { description?: string }) => <div>{description}</div>,
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("lucide-react", () => ({
  Trash2: () => null,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, className, style }: any) => (
    <a href={href} className={className} style={style}>
      {children}
    </a>
  ),
}));

const mockWorkspaces = [
  { id: "ws1", name: "Alpha", slug: "alpha" },
  { id: "ws2", name: "Beta", slug: "beta" },
];

describe("WorkspaceList", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders workspace names from API", async () => {
    const { api } = await import("@/lib/api");
    vi.mocked(api.get).mockResolvedValue({ workspaces: mockWorkspaces });

    render(<WorkspaceList />);

    await waitFor(() => {
      expect(screen.getByText("# Alpha")).toBeDefined();
      expect(screen.getByText("# Beta")).toBeDefined();
    });
  });

  it("shows loading skeleton while fetching", async () => {
    const { api } = await import("@/lib/api");
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

    render(<WorkspaceList />);

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no workspaces", async () => {
    const { api } = await import("@/lib/api");
    vi.mocked(api.get).mockResolvedValue({ workspaces: [] });

    render(<WorkspaceList />);

    await waitFor(() => {
      expect(screen.getByText("No workspaces yet")).toBeDefined();
    });
  });

  it("highlights active workspace", async () => {
    const { api } = await import("@/lib/api");
    vi.mocked(api.get).mockResolvedValue({ workspaces: mockWorkspaces });

    render(<WorkspaceList activeSlug="alpha" />);

    await waitFor(() => {
      const alpha = screen.getByRole("option", { name: /^# Alpha/i });
      expect(alpha.getAttribute("aria-selected")).toBe("true");
      const beta = screen.getByRole("option", { name: /^# Beta/i });
      expect(beta.getAttribute("aria-selected")).toBe("false");
    });
  });

  it("opens and closes delete confirmation dialog", async () => {
    const user = userEvent.setup();
    const { api } = await import("@/lib/api");
    vi.mocked(api.get).mockResolvedValue({ workspaces: mockWorkspaces });

    render(<WorkspaceList />);

    await waitFor(() => {
      expect(screen.getByText("# Alpha")).toBeDefined();
    });

    const deleteBtn = screen.getByLabelText("Delete workspace Alpha");
    await user.click(deleteBtn);

    expect(screen.getByRole("alertdialog")).toBeDefined();

    await user.click(screen.getByText("Cancel"));

    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("deletes workspace on confirm and removes from list", async () => {
    const user = userEvent.setup();
    const { api } = await import("@/lib/api");
    vi.mocked(api.get).mockResolvedValue({ workspaces: mockWorkspaces });
    vi.mocked(api.delete).mockResolvedValue({});

    render(<WorkspaceList />);

    await waitFor(() => {
      expect(screen.getByText("# Alpha")).toBeDefined();
    });

    await user.click(screen.getByLabelText("Delete workspace Alpha"));
    await user.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/workspaces/ws1");
      expect(screen.queryByText("# Alpha")).toBeNull();
      expect(screen.getByText("# Beta")).toBeDefined();
    });
  });
});
