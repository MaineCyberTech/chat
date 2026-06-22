// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../login-form";
import { AuthContext } from "../auth-context";

function renderLoginForm(overrides?: {
  signIn?: (email: string, password?: string) => Promise<{ error?: string }>;
}) {
  const mockSignIn = overrides?.signIn ?? (async () => ({}));
  return render(
    <AuthContext.Provider
      value={{
        user: null,
        loading: false,
        signIn: mockSignIn,
        signUp: async () => ({ error: "not implemented" }),
        signInWithGoogle: async () => {},
        signOut: async () => {},
      }}
    >
      <LoginForm />
    </AuthContext.Provider>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders email input, password input, and sign in/sign up tabs", () => {
    renderLoginForm();
    expect(screen.getByLabelText("Email address")).toBeDefined();
    expect(screen.getByLabelText("Password (optional for magic link)")).toBeDefined();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeDefined();
  });

  it("shows create account button when sign up tab is active", async () => {
    const user = userEvent.setup();
    renderLoginForm();
    await act(async () => {
      await user.click(screen.getByRole("button", { name: /sign up/i }));
    });
    expect(screen.getByRole("button", { name: /create account/i })).toBeDefined();
  });

  it("shows sent state after successful magic link submission", async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    const sendButtons = screen.getAllByRole("button", { name: /send magic link/i });
    await act(async () => {
      await user.click(sendButtons[0]!);
    });

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeDefined();
    });
  });

  it("shows error message on failed submission", async () => {
    const user = userEvent.setup();
    renderLoginForm({
      signIn: async () => ({ error: "Invalid email" }),
    });

    await user.type(screen.getByLabelText("Email address"), "bad@example.com");
    const errorButtons = screen.getAllByRole("button", { name: /send magic link/i });
    await act(async () => {
      await user.click(errorButtons[0]!);
    });

    await waitFor(() => {
      expect(screen.getByText("Invalid email")).toBeDefined();
    });
  });

  it("shows quick-fill test user buttons for local dev", () => {
    renderLoginForm();
    expect(screen.getByText("Admin")).toBeDefined();
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("Carol")).toBeDefined();
  });
});
