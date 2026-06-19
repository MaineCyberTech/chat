"use client";

import React, { useState } from "react";
import { useAuth } from "./auth-context";
import { Button } from "@chat/ui";

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
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950">
        <p className="text-green-800 dark:text-green-200">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded-lg border border-gray-300 px-4 py-2 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
      </div>
      {status === "error" && <p className="text-sm text-red-600 dark:text-red-400">{message}</p>}
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending link..." : "Send Magic Link"}
      </Button>
    </form>
  );
}
