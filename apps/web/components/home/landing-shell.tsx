"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@chat/ui";

interface Props {
  onGetStarted?: () => void;
  onLearnMore?: () => void;
}

export function LandingShell({ onGetStarted, onLearnMore }: Props) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 md:p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1
          className="text-3xl font-bold tracking-tight md:text-4xl"
          style={{ color: "var(--center-channel-color)" }}
        >
          MaineCyberTech Chat
        </h1>
        <p className="max-w-md text-base md:text-lg" style={{ color: "var(--text-secondary)" }}>
          Real-time workspace communication, inspired by the best.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="primary" onClick={onGetStarted}>
          Get Started
        </Button>
        <Button variant="secondary" onClick={onLearnMore}>
          Learn More
        </Button>
        <Link href="/install">
          <Button variant="ghost">Install App</Button>
        </Link>
      </div>
    </main>
  );
}
