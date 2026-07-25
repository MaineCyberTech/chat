"use client";

import React, { useState } from "react";
import { useAuth } from "./auth-context";
import { Button, Input } from "@chat/ui";
import { t } from "@/lib/i18n";

type Mode = "signin" | "signup";

const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

function userSafeError(err: unknown): string {
  if (typeof err !== "string")
    return t("common.somethingWentWrong", "Something went wrong. Please try again.");
  const msg = err.toLowerCase();
  if (msg.includes("invalid login credentials") || msg.includes("invalid email")) {
    return t("auth.invalidCredentials", "Invalid email or password");
  }
  if (msg.includes("email not confirmed") || msg.includes("email not verified")) {
    return t("auth.emailNotVerified", "Email not verified. Check your inbox.");
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return t("auth.rateLimited", "Too many attempts. Please wait a moment.");
  }
  if (msg.includes("user already registered") || msg.includes("already exists")) {
    return t("auth.emailAlreadyExists", "An account with this email already exists");
  }
  if (msg.includes("invalid otp") || msg.includes("invalid token")) {
    return t("auth.invalidLink", "This link is invalid or has expired");
  }
  return t("common.somethingWentWrong", "Something went wrong. Please try again.");
}

export function LoginForm() {
  const { signIn, signUp, signInWithGoogle, signInWithGithub } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "signedup" | "error">("idle");
  const [message, setMessage] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    if (!email) {
      setEmailError(t("auth.emailRequired", "Email is required"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t("auth.invalidEmail", "Please enter a valid email address"));
      return;
    }
    setStatus("loading");

    if (mode === "signup") {
      if (!password) {
        setStatus("error");
        setMessage(t("auth.passwordRequired", "Password is required for sign-up."));
        return;
      }
      const result = await signUp(email, password);
      if (result.error) {
        setStatus("error");
        setMessage(userSafeError(result.error));
      } else {
        setStatus("signedup");
        setMessage(t("auth.accountCreated", "Account created! Check your email to confirm."));
      }
      return;
    }

    if (password) {
      const result = await signIn(email, password);
      if (result.error) {
        setStatus("error");
        setMessage(userSafeError(result.error));
      } else {
        setStatus("sent");
        setMessage(t("auth.signedIn", "Signed in successfully."));
      }
    } else {
      const result = await signIn(email);
      if (result.error) {
        setStatus("error");
        setMessage(userSafeError(result.error));
      } else {
        setStatus("sent");
        setMessage(t("auth.magicLinkSent", "Check your email for a magic link."));
      }
    }
  }

  async function handleGoogleSignIn() {
    setStatus("loading");
    await signInWithGoogle();
  }

  if (status === "sent" || status === "signedup") {
    return (
      <div
        className="rounded-lg border p-6 text-center"
        style={{
          borderColor: "var(--online-indicator)",
          backgroundColor: "rgba(var(--online-indicator-rgb,6,214,160),0.12)",
        }}
      >
        <p style={{ color: "var(--online-indicator)" }} aria-live="polite" aria-atomic="true">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div
        className="flex overflow-hidden rounded-lg border"
        style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
      >
        <button
          onClick={() => {
            setMode("signin");
            setStatus("idle");
            setMessage("");
          }}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            mode === "signin"
              ? "text-[var(--button-color)]"
              : "hover:text-[var(--center-channel-color)]"
          }`}
          style={
            mode === "signin"
              ? { backgroundColor: "var(--button-bg)" }
              : {
                  backgroundColor: "var(--center-channel-bg)",
                  color: "var(--text-secondary)",
                }
          }
        >
          {t("auth.signIn", "Sign In")}
        </button>
        <button
          onClick={() => {
            setMode("signup");
            setStatus("idle");
            setMessage("");
          }}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            mode === "signup"
              ? "text-[var(--button-color)]"
              : "hover:text-[var(--center-channel-color)]"
          }`}
          style={
            mode === "signup"
              ? { backgroundColor: "var(--button-bg)" }
              : {
                  backgroundColor: "var(--center-channel-bg)",
                  color: "var(--text-secondary)",
                }
          }
        >
          {t("auth.signUp", "Sign Up")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          label={t("auth.emailLabel", "Email address")}
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
          }}
          placeholder={t("auth.emailPlaceholder", "you@example.com")}
        />
        {emailError && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--dnd-indicator)" }} role="alert">
            {emailError}
          </p>
        )}
        <Input
          id="password"
          label={
            mode === "signin"
              ? t("auth.passwordOptional", "Password (optional for magic link)")
              : t("auth.passwordLabel", "Password")
          }
          type="password"
          required={mode === "signup"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.passwordPlaceholder", "Enter your password")}
        />
        {mode === "signin" && (
          <p className="mt-[-8px] text-xs" style={{ color: "var(--text-tertiary)" }}>
            {t(
              "auth.forgotPassword",
              "Forgot password? Use the magic link above or contact support.",
            )}
          </p>
        )}
        {mode === "signup" && password && (
          <p
            className="text-xs"
            style={{
              color: password.length >= 8 ? "var(--online-indicator)" : "var(--dnd-indicator)",
            }}
            role="status"
            aria-live="polite"
          >
            {password.length >= 8
              ? t("auth.passwordStrong", "Strong")
              : t("auth.passwordWeak", "Weak - at least 8 characters")}
          </p>
        )}
        {status === "error" && (
          <p
            className="text-sm"
            style={{ color: "var(--dnd-indicator)" }}
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            {message}
          </p>
        )}
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />{" "}
              {t("auth.signingIn", "Signing in...")}
            </span>
          ) : mode === "signin" ? (
            password ? (
              t("auth.signIn", "Sign In")
            ) : (
              t("auth.sendMagicLink", "Send Magic Link")
            )
          ) : (
            t("auth.createAccount", "Create Account")
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div
            className="w-full border-t"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
          />
        </div>
        <div className="relative flex justify-center text-xs">
          <span
            className="bg-[var(--center-channel-bg)] px-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t("auth.orContinueWith", "or continue with")}
          </span>
        </div>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={status === "loading"}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google
      </Button>

      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          setStatus("loading");
          signInWithGithub();
        }}
        disabled={status === "loading"}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
        GitHub
      </Button>

      {isDev && (
        <div className="pt-2">
          <p className="mb-2 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
            {t("auth.devNotice", "Local dev — no test accounts in production")}
          </p>
        </div>
      )}
    </div>
  );
}
