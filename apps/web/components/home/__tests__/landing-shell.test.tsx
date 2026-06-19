// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingShell } from "../landing-shell";

describe("LandingShell", () => {
  it("renders the heading", () => {
    render(<LandingShell />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Chat Platform");
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
});
