"use client";

import React from "react";
import { useInstallPrompt } from "@/lib/pwa/install-state";
import { Button } from "@chat/ui";
import Link from "next/link";

export default function InstallPage() {
  const { isInstalled, isInstallable, install, getPlatform, getInstallInstructions } =
    useInstallPrompt();
  const platform = getPlatform();
  const instructions = getInstallInstructions();

  if (isInstalled) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 md:p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-status-success-bg)] text-2xl">
            ✓
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground-primary)]">
            Already Installed
          </h1>
          <p className="max-w-md text-base text-[var(--color-foreground-secondary)]">
            Chat Platform is already installed on your device. You can open it from your home screen
            or app launcher.
          </p>
        </div>
        <Link href="/">
          <Button variant="primary">Open App</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 md:p-8">
      <div className="flex max-w-md flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground-primary)]">
          Install Chat Platform
        </h1>
        <p className="text-base text-[var(--color-foreground-secondary)]">
          Get the full app experience: offline access, push notifications, and a home screen icon.
        </p>
      </div>

      <div className="w-full max-w-md">
        <div className="space-y-6 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] p-6">
          <div className="space-y-3">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-background-tertiary)] text-xs font-medium text-[var(--color-foreground-primary)]">
                  {index + 1}
                </span>
                <p className="pt-0.5 text-[var(--color-foreground-secondary)]">{step}</p>
              </div>
            ))}
          </div>

          {instructions.showButton && isInstallable && (
            <Button variant="primary" className="w-full" onClick={install} size="lg">
              Install App
            </Button>
          )}

          {!isInstallable && (
            <div className="text-center">
              <p className="text-sm text-[var(--color-foreground-tertiary)]">
                Your browser doesn&apos;t support automatic installation prompts. Follow the manual
                steps above for your platform ({platform}).
              </p>
            </div>
          )}

          <div className="border-t border-[var(--color-border-primary)] pt-4">
            <p className="text-center text-xs text-[var(--color-foreground-tertiary)]">
              <Link href="/" className="underline hover:text-[var(--color-foreground-primary)]">
                ← Back to Chat Platform
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
