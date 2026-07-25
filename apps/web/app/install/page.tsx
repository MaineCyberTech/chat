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
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-2xl"
            style={{ backgroundColor: "rgba(var(--online-indicator-rgb,6,214,160),0.12)" }}
          >
            ✓
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--center-channel-color)]">
            Already Installed
          </h1>
          <p className="max-w-md text-base" style={{ color: "var(--text-secondary)" }}>
            MaineCyberTech Chat is already installed on your device. You can open it from your home
            screen or app launcher.
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
        <h1 className="text-3xl font-bold tracking-tight text-[var(--center-channel-color)]">
          Install MaineCyberTech Chat
        </h1>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          Get the full app experience: offline access, push notifications, and a home screen icon.
        </p>
      </div>

      <div className="w-full max-w-md">
        <div
          className="space-y-6 rounded-lg border bg-[var(--center-channel-bg)] p-6"
          style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
        >
          <div className="space-y-3">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(var(--center-channel-color-rgb), 0.08)",
                    color: "var(--center-channel-color)",
                  }}
                >
                  {index + 1}
                </span>
                <p className="pt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {step}
                </p>
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
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Your browser doesn&apos;t support automatic installation prompts. Follow the manual
                steps above for your platform ({platform}).
              </p>
            </div>
          )}

          <div
            className="border-t pt-4"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
          >
            <p className="text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
              <Link href="/" className="underline hover:text-[var(--center-channel-color)]">
                {"\u2190"} Back to MaineCyberTech Chat
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
