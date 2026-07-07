// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SidebarGroup } from "../sidebar-group";

describe("SidebarGroup", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders title", () => {
    render(<SidebarGroup title="Channels"><p /></SidebarGroup>);
    expect(screen.getByText("Channels")).toBeDefined();
  });

  it("shows children by default", () => {
    render(<SidebarGroup title="Channels"><p data-testid="child" /></SidebarGroup>);
    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("hides children when defaultOpen is false", () => {
    render(<SidebarGroup title="Channels" defaultOpen={false}><p data-testid="child" /></SidebarGroup>);
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("toggles children on click", () => {
    render(<SidebarGroup title="Channels"><p data-testid="child" /></SidebarGroup>);
    expect(screen.getByTestId("child")).toBeDefined();
    fireEvent.click(screen.getByText("Channels"));
    expect(screen.queryByTestId("child")).toBeNull();
    fireEvent.click(screen.getByText("Channels"));
    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("renders toggle button", () => {
    render(<SidebarGroup title="DM"><p data-testid="child" /></SidebarGroup>);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
