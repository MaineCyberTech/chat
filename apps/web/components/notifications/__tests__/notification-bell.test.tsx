// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationBell } from "../notification-bell";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("lucide-react", () => ({
  Bell: () => null,
}));

describe("NotificationBell", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders bell icon button", () => {
    vi.mocked(api.get).mockResolvedValue({ unread: 0 });
    render(<NotificationBell />);
    expect(screen.getByLabelText(/notifications/i)).toBeDefined();
  });

  it("shows unread count badge", async () => {
    vi.mocked(api.get).mockResolvedValue({ unread: 3 });
    render(<NotificationBell />);
    await waitFor(() => {
      expect(screen.getByText("3")).toBeDefined();
    });
  });

  it("shows 99+ for large counts", async () => {
    vi.mocked(api.get).mockResolvedValue({ unread: 150 });
    render(<NotificationBell />);
    await waitFor(() => {
      expect(screen.getByText("99+")).toBeDefined();
    });
  });

  it("opens dropdown on click and shows empty state", async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((path: string) => {
      if (path === "/notifications/unread") return Promise.resolve({ unread: 0 });
      if (path === "/notifications") return Promise.resolve({ notifications: [], unread: 0 });
      return Promise.resolve({});
    });
    render(<NotificationBell />);
    await act(async () => {
      await user.click(screen.getByLabelText(/notifications/i));
    });
    expect(screen.getByRole("menu")).toBeDefined();
    expect(screen.getByText("No notifications")).toBeDefined();
  });

  it("opens dropdown and renders notifications", async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((path: string) => {
      if (path === "/notifications/unread") return Promise.resolve({ unread: 1 });
      if (path === "/notifications")
        return Promise.resolve({
          notifications: [
            {
              id: "n1",
              type: "mention",
              title: "Test notification",
              body: "Hello world",
              read: false,
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
          unread: 1,
        });
      return Promise.resolve({});
    });
    render(<NotificationBell />);
    await act(async () => {
      await user.click(screen.getByLabelText(/notifications/i));
    });
    expect(screen.getByText("Test notification")).toBeDefined();
    expect(screen.getByText("Hello world")).toBeDefined();
  });

  it("closes dropdown on click outside", async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((path: string) => {
      if (path === "/notifications/unread") return Promise.resolve({ unread: 0 });
      if (path === "/notifications") return Promise.resolve({ notifications: [], unread: 0 });
      return Promise.resolve({});
    });
    render(<NotificationBell />);
    await act(async () => {
      await user.click(screen.getByLabelText(/notifications/i));
    });
    expect(screen.getByRole("menu")).toBeDefined();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("marks notification as read on click", async () => {
    const user = userEvent.setup();
    const apiGet = vi.mocked(api.get);
    const apiPatch = vi.mocked(api.patch);
    apiGet.mockImplementation((path: string) => {
      if (path === "/notifications/unread") return Promise.resolve({ unread: 1 });
      if (path === "/notifications")
        return Promise.resolve({
          notifications: [
            {
              id: "n1",
              type: "mention",
              title: "Read me",
              body: null,
              read: false,
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
          unread: 1,
        });
      return Promise.resolve({});
    });
    apiPatch.mockResolvedValue({});
    render(<NotificationBell />);
    await act(async () => {
      await user.click(screen.getByLabelText(/notifications/i));
    });
    const item = screen.getByRole("menuitem");
    await act(async () => {
      await user.click(item);
    });
    expect(apiPatch).toHaveBeenCalledWith("/notifications/n1/read", {});
  });

  it("closes on Escape key", async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((path: string) => {
      if (path === "/notifications/unread") return Promise.resolve({ unread: 0 });
      if (path === "/notifications") return Promise.resolve({ notifications: [], unread: 0 });
      return Promise.resolve({});
    });
    render(<NotificationBell />);
    await act(async () => {
      await user.click(screen.getByLabelText(/notifications/i));
    });
    const menu = screen.getByRole("menu");
    expect(menu).toBeDefined();
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
