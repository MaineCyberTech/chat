// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dialog } from "../dialog";

describe("Dialog", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <Dialog open={false} onClose={() => {}} title="Test">
        <p>Content</p>
      </Dialog>,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders content when open", () => {
    render(
      <Dialog open={true} onClose={() => {}} title="Test Dialog">
        <p>Dialog content</p>
      </Dialog>,
    );
    expect(screen.getByText("Dialog content")).toBeDefined();
    expect(screen.getByText("Test Dialog")).toBeDefined();
  });

  it("renders without title", () => {
    render(
      <Dialog open={true} onClose={() => {}}>
        <p>Content</p>
      </Dialog>,
    );
    expect(screen.getByText("Content")).toBeDefined();
  });

  it("calls onClose when overlay is clicked", () => {
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose}>
        <p>Content</p>
      </Dialog>,
    );
    const overlay = document.querySelector(".fixed.inset-0.bg-\\[var\\(--color-dialog-overlay\\)\\]");
    if (overlay) fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose}>
        <p>Content</p>
      </Dialog>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("has accessible dialog role and label", () => {
    render(
      <Dialog open={true} onClose={() => {}} title="Accessible Dialog">
        <p>Content</p>
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("dialog-title");
  });

  it("has close button with aria-label", () => {
    render(
      <Dialog open={true} onClose={() => {}} title="Test">
        <p>Content</p>
      </Dialog>,
    );
    expect(screen.getByLabelText("Close dialog")).toBeDefined();
  });

  it("locks body scroll when open", () => {
    render(
      <Dialog open={true} onClose={() => {}}>
        <p>Content</p>
      </Dialog>,
    );
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body scroll when closed", () => {
    const { rerender } = render(
      <Dialog open={true} onClose={() => {}}>
        <p>Content</p>
      </Dialog>,
    );
    rerender(
      <Dialog open={false} onClose={() => {}}>
        <p>Content</p>
      </Dialog>,
    );
    expect(document.body.style.overflow).toBe("");
  });
});
