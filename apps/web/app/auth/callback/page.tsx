"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, verifyMagicLink } from "@/lib/auth/client";

export const dynamic = "force-dynamic";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const linkError = searchParams.get("error");

    async function handleAuth() {
      if (linkError) {
        setError("Authentication failed. Please try signing in again.");
        return;
      }

      // Magic-link landing: exchange the single-use token for a session.
      if (token) {
        const result = await verifyMagicLink(token);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.push("/");
        return;
      }

      // No token: this may be a redirect after sign-in that already established
      // a session, or a bare visit.
      if (getSession()) {
        router.push("/");
        return;
      }

      setError("Authentication failed. Please try signing in again.");
    }

    handleAuth().catch(() => {
      setError("An unexpected error occurred.");
    });
  }, [router, searchParams]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p style={{ color: "var(--dnd-indicator)" }}>{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="text-sm underline hover:text-[var(--center-channel-color)]"
            style={{ color: "var(--text-secondary)" }}
          >
            Back to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <p style={{ color: "var(--text-secondary)" }}>Completing sign in...</p>
        <div
          className="h-1 w-32 overflow-hidden rounded-full"
          style={{ backgroundColor: "rgba(var(--center-channel-color-rgb), 0.08)" }}
        >
          <div
            className="h-full animate-pulse rounded-full bg-[var(--color-accent-primary)]"
            style={{ width: "60%" }}
          />
        </div>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                borderTopColor: "var(--button-bg)",
              }}
            />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Completing sign in...
            </p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
