// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallPrompt } from "../install-prompt";

vi.mock("@/lib/pwa/install-state", () => ({
  useInstallPrompt: vi.fn(),
}));

vi.mock("@chat/ui", () => ({
  Button: ({ children, onClick }: Record<string, unknown>) =>
    React.createElement("button", { onClick }, children as React.ReactNode),
  Dialog: ({ open, children, title }: Record<string, unknown>) =>
    open
      ? React.createElement(
          "div",
          { role: "dialog", "aria-label": title as string },
          children as React.ReactNode,
        )
      : null,
}));

import { useInstallPrompt } from "@/lib/pwa/install-state";

const baseMock = {
  deferredPrompt: null,
  isInstallable: false,
  isInstalled: false,
  install: vi.fn().mockResolvedValue(true),
  getPlatform: () => "windows" as const,
  getInstallInstructions: () => ({
    title: "Install on Desktop",
    steps: ["Step 1: Click install icon", "Step 2: Confirm"],
    showButton: true,
  }),
};

describe("InstallPrompt", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.mocked(useInstallPrompt).mockReturnValue(baseMock);
  });

  it("renders nothing when closed", () => {
    render(<InstallPrompt isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders nothing when already installed", () => {
    vi.mocked(useInstallPrompt).mockReturnValue({
      ...baseMock,
      isInstalled: true,
      getInstallInstructions: () => ({
        title: "Install on Desktop",
        steps: ["Step 1"],
        showButton: false,
      }),
    });
    render(<InstallPrompt isOpen={true} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders dialog with instructions when open and not installed", () => {
    render(<InstallPrompt isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: /install on desktop/i })).toBeDefined();
    expect(screen.getByText("Step 1: Click install icon")).toBeDefined();
    expect(screen.getByText("Step 2: Confirm")).toBeDefined();
  });

  it("shows install button when installable", () => {
    vi.mocked(useInstallPrompt).mockReturnValue({
      ...baseMock,
      isInstallable: true,
      getInstallInstructions: () => ({
        title: "Install on Desktop",
        steps: ["Step 1"],
        showButton: true,
      }),
    });
    render(<InstallPrompt isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /install app/i })).toBeDefined();
  });

  it("calls install and onClose when Install App is clicked", async () => {
    const onClose = vi.fn();
    const install = vi.fn().mockResolvedValue(true);
    vi.mocked(useInstallPrompt).mockReturnValue({
      ...baseMock,
      isInstallable: true,
      install,
    });
    const user = userEvent.setup();
    render(<InstallPrompt isOpen={true} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /install app/i }));
    expect(install).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when install fails", async () => {
    const onClose = vi.fn();
    const install = vi.fn().mockResolvedValue(false);
    vi.mocked(useInstallPrompt).mockReturnValue({
      ...baseMock,
      isInstallable: true,
      install,
    });
    const user = userEvent.setup();
    render(<InstallPrompt isOpen={true} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /install app/i }));
    expect(install).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows sync message when user is signed in and not installable", () => {
    vi.mocked(useInstallPrompt).mockReturnValue({
      ...baseMock,
      getInstallInstructions: () => ({
        title: "Install on iOS",
        steps: ["Step 1"],
        showButton: false,
      }),
    });
    render(<InstallPrompt isOpen={true} onClose={vi.fn()} userEmail="user@test.com" />);
    expect(screen.getByText(/signed in.*data will sync/i)).toBeDefined();
  });
});
