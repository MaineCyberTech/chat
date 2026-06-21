"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { AvatarUpload } from "@/components/auth/avatar-upload";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (!user) return null;

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-950">
      <Link href="/" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Chat Platform
      </Link>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <AvatarUpload />
        <span className="text-xs text-gray-500">{user.email}</span>
        <button
          onClick={handleSignOut}
          className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
