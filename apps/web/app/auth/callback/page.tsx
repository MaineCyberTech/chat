"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const supabase = getSupabaseBrowserClient();

    async function handleAuth() {
      if (code) {
        // Exchange the code for a session (magic link flow)
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      }

      // Verify session exists after code exchange or if already logged in
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
        <p className="text-[var(--color-status-danger-fg)]">{error}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <p className="text-[var(--color-foreground-secondary)]">Completing sign in...</p>
    </main>
  );
}
