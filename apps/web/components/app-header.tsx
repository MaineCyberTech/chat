"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { AvatarUpload } from "@/components/auth/avatar-upload";
import { Button, ThemeToggle } from "@chat/ui";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (!user) return null;

  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border-primary)] bg-[var(--color-background-primary)] px-4 py-2">
      <Link href="/" className="text-sm font-semibold text-[var(--color-foreground-primary)]">
        Chat Platform
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationBell />
        <AvatarUpload />
        <span className="text-xs text-[var(--color-foreground-tertiary)]">{user.email}</span>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Logout
        </Button>
      </div>
    </header>
  );
}
