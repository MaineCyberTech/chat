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
          <div
            className="h-8 w-8 animate-spin rounded-full border-2"
            style={{
              borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
              borderTopColor: "var(--button-bg)",
            }}
          />
          <p className="text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
            Loading...
          </p>
        </div>
      </main>
    );
  }

  if (user && fetchError) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
            Unable to load your workspaces.
          </p>
          <p className="text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
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
          <p style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
            Redirecting to your workspace...
          </p>
          <div
            className="h-1 w-32 overflow-hidden rounded-full"
            style={{ backgroundColor: "rgba(var(--center-channel-color-rgb), 0.08)" }}
          >
            <div
              className="h-full animate-pulse rounded-full"
              style={{ width: "60%", backgroundColor: "var(--button-bg)" }}
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
        <p style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
          Sign in with email and password, or use a magic link.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
