// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "../button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDefined();
  });

  it("applies primary variant by default", () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByText("Primary");
    expect(btn.className).toContain("bg-blue-600");
  });

  it("applies secondary variant styles", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByText("Secondary");
    expect(btn.className).toContain("bg-gray-100");
  });

  it("applies ghost variant styles", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByText("Ghost");
    expect(btn.className).toContain("bg-transparent");
  });

  it("applies size classes", () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByText("Large");
    expect(btn.className).toContain("text-lg");
  });

  it("passes extra className", () => {
    render(<Button className="extra">Extra</Button>);
    const btn = screen.getByText("Extra");
    expect(btn.className).toContain("extra");
  });

  it("sets disabled attribute", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText("Disabled").closest("button")?.disabled).toBe(true);
  });
});
