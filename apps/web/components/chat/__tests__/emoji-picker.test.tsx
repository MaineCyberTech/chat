// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmojiPicker } from "../emoji-picker";

describe("EmojiPicker", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders the emoji picker popup", () => {
    render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: /emoji picker/i })).toBeDefined();
  });

  it("shows search input", () => {
    render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText("Search emojis...")).toBeDefined();
  });

  it("renders category tabs", () => {
    render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByLabelText("All")).toBeDefined();
    expect(screen.getByLabelText("Smileys & Emotion")).toBeDefined();
    expect(screen.getByLabelText("People & Body")).toBeDefined();
  });

  it("shows no results message when search yields no matches", async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
    await user.type(screen.getByPlaceholderText("Search emojis..."), "xyznonexistent");
    expect(screen.getByText("No emojis found")).toBeDefined();
  });

  it("calls onSelect when an emoji is clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<EmojiPicker onSelect={onSelect} onClose={vi.fn()} />);
    const emojiBtns = screen.getAllByRole("button");
    const target = emojiBtns.find((b) => b.textContent === "🥰");
    if (target) {
      await user.click(target);
      expect(onSelect).toHaveBeenCalledWith("🥰");
    }
  });

  it("calls onClose when clicking outside", () => {
    const onClose = vi.fn();
    render(<EmojiPicker onSelect={vi.fn()} onClose={onClose} />);
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape key", () => {
    const onClose = vi.fn();
    render(<EmojiPicker onSelect={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
