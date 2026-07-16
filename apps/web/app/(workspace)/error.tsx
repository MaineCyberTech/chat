"use client";

import { Button } from "@chat/ui";

export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex h-screen flex-col items-center justify-center gap-4"
      style={{ backgroundColor: "var(--center-channel-bg)" }}
    >
      <h1 className="text-xl font-semibold" style={{ color: "var(--center-channel-color)" }}>
        Something went wrong
      </h1>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        An error occurred in the workspace view.
      </p>
      <Button onClick={() => reset()}>Try Again</Button>
    </div>
  );
}
