// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { LandingShell } from "../landing-shell";

describe("LandingShell", () => {
  afterEach(() => cleanup());

  it("renders the heading", () => {
    render(<LandingShell />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Chat Platform");
  });

  it("renders the tagline", () => {
    render(<LandingShell />);
    expect(
      screen.getByText("Real-time workspace communication, inspired by the best."),
    ).toBeDefined();
  });

  it("renders CTA buttons", () => {
    render(<LandingShell />);
    expect(screen.getByText("Get Started")).toBeDefined();
    expect(screen.getByText("Learn More")).toBeDefined();
  });

  it("calls onGetStarted when Get Started button is clicked", () => {
    const handler = vi.fn();
    render(<LandingShell onGetStarted={handler} />);
    screen.getByText("Get Started").click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("calls onLearnMore when Learn More button is clicked", () => {
    const handler = vi.fn();
    render(<LandingShell onLearnMore={handler} />);
    screen.getByText("Learn More").click();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
