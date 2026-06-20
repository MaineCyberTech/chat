"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@chat/ui";

export function LandingShell() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Chat Platform</h1>
        <p className="max-w-md text-lg text-gray-500 dark:text-gray-400">
          Real-time workspace communication, inspired by the best.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="primary" onClick={() => router.push("/login")}>
          Get Started
        </Button>
        <Button
          variant="secondary"
          onClick={() => window.open("https://mainecybertech.com", "_blank")}
        >
          Learn More
        </Button>
      </div>
    </main>
  );
}
