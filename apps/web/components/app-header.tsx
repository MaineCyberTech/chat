"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";

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
