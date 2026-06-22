"use client";

import React from "react";
import { useServiceWorker } from "@/lib/pwa/install-state";
import { Button } from "@chat/ui";

export function UpdateNotification() {
  const { updateAvailable, applyUpdate, checkForUpdate } = useServiceWorker();

  if (!updateAvailable) return null;

  return (
    <div
      className="animate-slide-in-right fixed right-4 bottom-4 z-50"
      role="status"
      aria-live="polite"
    >
      <div className="flex min-w-[300px] items-center gap-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] px-4 py-3 shadow-[var(--shadow-xl)]">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--color-foreground-primary)]">
            Update Available
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-foreground-secondary)]">
            A new version of the app is ready. Refresh to update.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={checkForUpdate}>
            Check Again
          </Button>
          <Button variant="primary" size="sm" onClick={applyUpdate}>
            Refresh Now
          </Button>
        </div>
      </div>
    </div>
  );
}
