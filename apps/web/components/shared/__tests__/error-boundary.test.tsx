// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { captureException } from "@sentry/nextjs";
import { ErrorBoundary } from "../error-boundary";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

vi.mock("@chat/ui", () => ({
  Button: ({ children, onClick }: Record<string, unknown>) =>
    React.createElement("button", { onClick }, children as React.ReactNode),
}));

function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) throw new Error("Test error");
  return React.createElement("div", null, "Normal child");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Hello world</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Hello world")).toBeDefined();
  });

  it("shows default fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(screen.getByText(/An unexpected error occurred/)).toBeDefined();
    expect(screen.getByRole("button", { name: /refresh page/i })).toBeDefined();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom error message</div>}>
        <ThrowError shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId("custom-fallback")).toBeDefined();
    expect(screen.getByText("Custom error message")).toBeDefined();
  });

  it("calls Sentry.captureException when Sentry DSN is set", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://test@sentry.io/123";
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>,
    );
    expect(vi.mocked(captureException)).toHaveBeenCalled();
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  });

  it("does not call Sentry when DSN is not set", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>,
    );
    expect(vi.mocked(captureException)).not.toHaveBeenCalled();
  });
});
