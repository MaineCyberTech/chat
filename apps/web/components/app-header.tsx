"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { AvatarUpload } from "@/components/auth/avatar-upload";
import { Button, ThemeToggle } from "@chat/ui";
import { usePWA } from "@/components/pwa/pwa-provider";
import { Smartphone, Bell } from "lucide-react";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { showInstallPrompt, showNotificationPrompt } = usePWA();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (!user) return null;

  return (
    <header
      className="flex shrink-0 items-center justify-between border-b px-4 py-2"
      style={{
        borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
        backgroundColor: "var(--center-channel-bg)",
      }}
    >
      <Link
        href="/"
        className="text-sm font-semibold"
        style={{ color: "var(--center-channel-color)" }}
      >
        MaineCyberTech Chat
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationBell />
        <AvatarUpload />
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {user.email}
        </span>
        <Button variant="ghost" size="sm" onClick={showInstallPrompt} aria-label="Install app">
          <Smartphone size={18} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={showNotificationPrompt}
          aria-label="Notification settings"
        >
          <Bell size={18} />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Logout
        </Button>
      </div>
    </header>
  );
}
