"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { LoginForm } from "@/components/auth/login-form";
import { api } from "@/lib/api";
import type { Workspace } from "@chat/db";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ workspaces: Workspace[] }>("/workspaces")
      .then((res) => {
        if (res.workspaces.length > 0) {
          const first = res.workspaces[0];
          if (first) {
            router.push(`/${first.slug}`);
            return;
          }
        }
        router.push("/?new=true");
      })
      .catch(() => {
        setFetchError(true);
      });
  }, [user, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border-primary)] border-t-[var(--color-brand-primary)]" />
          <p className="text-sm text-[var(--color-foreground-secondary)]">Loading...</p>
        </div>
      </main>
    );
  }

  if (user && fetchError) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-[var(--color-foreground-secondary)]">
            Unable to load your workspaces.
          </p>
          <p className="text-sm text-[var(--color-foreground-tertiary)]">
            Please try refreshing the page.
          </p>
        </div>
      </main>
    );
  }

  if (user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <p className="text-[var(--color-foreground-secondary)]">
            Redirecting to your workspace...
          </p>
          <div className="h-1 w-32 overflow-hidden rounded-full bg-[var(--color-background-tertiary)]">
            <div
              className="h-full animate-pulse rounded-full bg-[var(--color-brand-primary)]"
              style={{ width: "60%" }}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="text-[var(--color-foreground-secondary)]">
          Sign in with email and password, or use a magic link.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
