// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Admin</Badge>);
    expect(screen.getByText("Admin")).toBeDefined();
  });

  it("applies success variant", () => {
    render(<Badge variant="success">Online</Badge>);
    const el = screen.getByText("Online");
    expect(el.className).toContain("bg-[var(--color-badge-success-bg)]");
  });

  it("applies danger variant", () => {
    render(<Badge variant="danger">Banned</Badge>);
    const el = screen.getByText("Banned");
    expect(el.className).toContain("bg-[var(--color-badge-danger-bg)]");
  });
});
