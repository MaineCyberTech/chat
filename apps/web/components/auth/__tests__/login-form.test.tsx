// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../login-form";
import { AuthContext } from "../auth-context";

function renderLoginForm(overrides?: { signIn?: () => Promise<{ error?: string }> }) {
  const mockSignIn = overrides?.signIn ?? (async () => ({}));
  return render(
    <AuthContext.Provider
      value={{
        user: null,
        loading: false,
        signIn: mockSignIn,
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

  it("renders email input and submit button", () => {
    renderLoginForm();
    expect(screen.getByLabelText("Email address")).toBeDefined();
    expect(screen.getByRole("button", { name: /send magic link/i })).toBeDefined();
  });

  it("shows sent state after successful submission", async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    const sendButtons = screen.getAllByRole("button", { name: /send magic link/i });
    await user.click(sendButtons[0]!);

    expect(await screen.findByText(/check your email/i)).toBeDefined();
  });

  it("shows error message on failed submission", async () => {
    const user = userEvent.setup();
    renderLoginForm({
      signIn: async () => ({ error: "Invalid email" }),
    });

    await user.type(screen.getByLabelText("Email address"), "bad@example.com");
    const errorButtons = screen.getAllByRole("button", { name: /send magic link/i });
    await user.click(errorButtons[0]!);

    expect(await screen.findByText("Invalid email")).toBeDefined();
  });
});
