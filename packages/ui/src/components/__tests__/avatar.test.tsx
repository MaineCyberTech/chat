// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Avatar } from "../avatar";

describe("Avatar", () => {
  afterEach(() => cleanup());
  it("renders initials from fallback", () => {
    render(<Avatar fallback="John Doe" />);
    expect(screen.getByText("JD")).toBeDefined();
  });

  it("renders fallback when no src", () => {
    render(<Avatar fallback="A" />);
    expect(screen.getByText("A")).toBeDefined();
  });

  it("renders image when src provided", () => {
    render(<Avatar src="https://example.com/avatar.png" alt="User" />);
    const img = screen.getByAltText("User");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("https://example.com/avatar.png");
  });

  it("applies size variant", () => {
    render(<Avatar fallback="John Doe" size="lg" />);
    const el = screen.getByText("JD");
    expect(el.className).toContain("h-12");
  });
});
