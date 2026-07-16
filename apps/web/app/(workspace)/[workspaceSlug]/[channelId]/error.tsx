"use client";

import { useEffect } from "react";
import { Button } from "@chat/ui";

export default function ChannelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {}, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center"
      style={{ backgroundColor: "var(--center-channel-bg)" }}
    >
      <h1 className="text-xl font-bold" style={{ color: "var(--center-channel-color)" }}>
        Failed to load channel
      </h1>
      <p className="max-w-md text-sm" style={{ color: "var(--text-secondary)" }}>
        An unexpected error occurred while loading this channel. Please try again.
      </p>
      <Button onClick={() => reset()}>Try Again</Button>
    </div>
  );
}
