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
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-background-primary)] p-8 text-center">
      <h1 className="text-2xl font-bold text-[var(--color-foreground-primary)]">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm text-[var(--color-foreground-secondary)]">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={() => reset()}>Try Again</Button>
    </div>
  );
}
