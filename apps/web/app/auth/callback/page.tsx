"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const supabase = getSupabaseBrowserClient();

    async function handleAuth() {
      // Try PKCE code exchange first
      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        if (data?.session) {
          router.push("/");
          return;
        }
      }

      // Try hash-based session (implicit flow fallback)
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.replace("#", ""));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          router.push("/");
          return;
        }
      }

      // Check if session already exists
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError("Authentication failed. Please try signing in again.");
      } else {
        router.push("/");
      }
    }

    handleAuth().catch(() => {
      setError("An unexpected error occurred.");
    });
  }, [router, searchParams]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-[var(--color-status-danger-fg)]">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-[var(--color-foreground-secondary)] underline hover:text-[var(--color-foreground-primary)]"
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
        <p className="text-[var(--color-foreground-secondary)]">Completing sign in...</p>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-[var(--color-background-tertiary)]">
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border-primary)] border-t-[var(--color-brand-primary)]" />
            <p className="text-sm text-[var(--color-foreground-secondary)]">
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
