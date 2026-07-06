// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateWorkspaceDialog } from "../create-workspace-dialog";

vi.mock("@/lib/api", () => ({
  api: {
    post: vi.fn(),
  },
}));

vi.mock("@chat/ui", () => ({
  Dialog: ({
    open,
    children,
    title,
  }: {
    open: boolean;
    children: React.ReactNode;
    title?: string;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {title && <h2>{title}</h2>}
        {children}
      </div>
    ) : null,
  Button: ({
    children,
    onClick,
    disabled,
    type,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    variant?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} type={type} data-variant={variant}>
      {children}
    </button>
  ),
  Input: ({
    label,
    value,
    onChange,
    placeholder,
    error,
  }: {
    label?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
  }) => (
    <div>
      {label && <label htmlFor={label}>{label}</label>}
      <input
        id={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={label}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("CreateWorkspaceDialog", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders create dialog trigger", () => {
    render(<CreateWorkspaceDialog />);
    expect(screen.getByRole("button", { name: /add workspace/i })).toBeDefined();
  });

  it("opens dialog on click", async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceDialog />);

    await user.click(screen.getByRole("button", { name: /add workspace/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
      expect(screen.getByText("Create Workspace")).toBeDefined();
    });
  });

  it("does not submit when name is empty", async () => {
    const user = userEvent.setup();
    const { api } = await import("@/lib/api");

    render(<CreateWorkspaceDialog />);

    await user.click(screen.getByRole("button", { name: /add workspace/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
    });

    await user.click(screen.getByText("Create"));

    expect(api.post).not.toHaveBeenCalled();
  });

  it("creates workspace on submit", async () => {
    const user = userEvent.setup();
    const { api } = await import("@/lib/api");
    vi.mocked(api.post).mockResolvedValue({ workspace: { slug: "my-team" } });

    render(<CreateWorkspaceDialog />);

    await user.click(screen.getByRole("button", { name: /add workspace/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
    });

    await user.type(screen.getByLabelText("Name"), "My Team");
    await user.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/workspaces", { name: "My Team" });
    });
  });

  it("calls onCreated callback after success", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const { api } = await import("@/lib/api");
    vi.mocked(api.post).mockResolvedValue({ workspace: { slug: "my-team" } });

    render(<CreateWorkspaceDialog onCreated={onCreated} />);

    await user.click(screen.getByRole("button", { name: /add workspace/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
    });

    await user.type(screen.getByLabelText("Name"), "My Team");
    await user.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalled();
    });
  });
});
