"use client";

import React, { useState } from "react";
import { useAuth } from "./auth-context";
import { Button, Input } from "@chat/ui";

export function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    const result = await signIn(email);
    if (result.error) {
      setStatus("error");
      setMessage(result.error);
    } else {
      setStatus("sent");
      setMessage("Check your email for a magic link.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)] p-6 text-center">
        <p className="text-[var(--color-status-success-fg)]">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <Input
        id="email"
        label="Email address"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      {status === "error" && (
        <p className="text-sm text-[var(--color-status-danger-fg)]" role="alert">
          {message}
        </p>
      )}
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending link..." : "Send Magic Link"}
      </Button>
    </form>
  );
}
