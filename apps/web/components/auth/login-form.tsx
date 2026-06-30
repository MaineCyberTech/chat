"use client";

import React, { useState } from "react";
import { useAuth } from "./auth-context";
import { Button, Input } from "@chat/ui";

type Mode = "signin" | "signup";

const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

export function LoginForm() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "signedup" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    if (mode === "signup") {
      if (!password) {
        setStatus("error");
        setMessage("Password is required for sign-up.");
        return;
      }
      const result = await signUp(email, password);
      if (result.error) {
        setStatus("error");
        setMessage(result.error);
      } else {
        setStatus("signedup");
        setMessage("Account created! Check your email to confirm.");
      }
      return;
    }

    if (password) {
      const result = await signIn(email, password);
      if (result.error) {
        setStatus("error");
        setMessage(result.error);
      } else {
        setStatus("sent");
        setMessage("Signed in successfully.");
      }
    } else {
      const result = await signIn(email);
      if (result.error) {
        setStatus("error");
        setMessage(result.error);
      } else {
        setStatus("sent");
        setMessage("Check your email for a magic link.");
      }
    }
  }

  async function handleGoogleSignIn() {
    setStatus("loading");
    await signInWithGoogle();
  }

  if (status === "sent" || status === "signedup") {
    return (
      <div className="rounded-lg border border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)] p-6 text-center">
        <p className="text-[var(--color-status-success-fg)]">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex overflow-hidden rounded-lg border border-[var(--color-border-primary)]">
        <button
          onClick={() => {
            setMode("signin");
            setStatus("idle");
            setMessage("");
          }}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            mode === "signin"
              ? "bg-[var(--color-button-primary-bg)] text-[var(--color-button-primary-fg)]"
              : "bg-[var(--color-background-primary)] text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground-primary)]"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setMode("signup");
            setStatus("idle");
            setMessage("");
          }}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            mode === "signup"
              ? "bg-[var(--color-button-primary-bg)] text-[var(--color-button-primary-fg)]"
              : "bg-[var(--color-background-primary)] text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground-primary)]"
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          label="Email address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Input
          id="password"
          label={mode === "signin" ? "Password (optional for magic link)" : "Password"}
          type="password"
          required={mode === "signup"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
        {status === "error" && (
          <p className="text-sm text-[var(--color-status-danger-fg)]" role="alert">
            {message}
          </p>
        )}
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading"
            ? "Loading..."
            : mode === "signin"
              ? password
                ? "Sign In"
                : "Send Magic Link"
              : "Create Account"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--color-border-primary)]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[var(--color-background-primary)] px-2 text-[var(--color-foreground-tertiary)]">
            or continue with
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

      {isDev && (
        <div className="pt-2">
          <p className="mb-2 text-center text-xs text-[var(--color-foreground-tertiary)]">
            Local dev — no test accounts in production
          </p>
        </div>
      )}
    </div>
  );
}
