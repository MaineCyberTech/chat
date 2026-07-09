"use client";

import { useEffect } from "react";
import { Button } from "@chat/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {}, [error]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center"
      style={{ backgroundColor: "var(--center-channel-bg)" }}
    >
      <h1 className="text-2xl font-bold" style={{ color: "var(--center-channel-color)" }}>
        Something went wrong
      </h1>
      <p className="max-w-md text-sm" style={{ color: "var(--text-secondary)" }}>
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={() => reset()}>Try Again</Button>
    </div>
  );
}
