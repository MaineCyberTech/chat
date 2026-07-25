"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (resendError) {
        setError(resendError.message);
      } else {
        setResent(true);
      }
    } catch {
      setError("Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(var(--online-indicator-rgb,6,214,160),0.12)" }}
        >
          <svg
            className="h-6 w-6"
            style={{ color: "var(--online-indicator)" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--center-channel-color)" }}>
          Check your email
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          We&apos;ve sent a verification link to <strong>{email || "your email"}</strong>. Click the
          link to activate your account.
        </p>
        {error && (
          <p className="text-sm" style={{ color: "var(--dnd-indicator)" }} role="alert">
            {error}
          </p>
        )}
        {resent && (
          <p className="text-sm" style={{ color: "var(--online-indicator)" }} role="status">
            Verification email resent!
          </p>
        )}
        <button
          onClick={handleResend}
          disabled={resending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "var(--button-bg)" }}
        >
          {resending ? "Sending..." : "Resend verification email"}
        </button>
        <button
          onClick={() => router.push("/login")}
          className="text-sm underline hover:text-[var(--center-channel-color)]"
          style={{ color: "var(--text-secondary)" }}
        >
          Back to login
        </button>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                borderTopColor: "var(--button-bg)",
              }}
            />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Loading...
            </p>
          </div>
        </main>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
