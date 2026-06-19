// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "../input";

describe("Input", () => {
  it("renders with label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeDefined();
  });

  it("renders error message", () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText("Invalid email")).toBeDefined();
  });

  it("handles user input", async () => {
    const onChange = vi.fn();
    render(<Input label="Name" onChange={onChange} />);
    const input = screen.getByLabelText("Name");
    await userEvent.type(input, "hello");
    expect(onChange).toHaveBeenCalled();
  });

  it("passes through HTML attributes", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeDefined();
  });
});
