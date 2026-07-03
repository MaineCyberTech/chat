"use client";

export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[var(--color-background-primary)]">
      <h2 className="text-xl font-semibold text-[var(--color-foreground-primary)]">
        Something went wrong
      </h2>
      <p className="text-sm text-[var(--color-foreground-secondary)]">
        An error occurred in the workspace view.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-[var(--color-foreground-primary)] px-4 py-2 text-sm text-[var(--color-background-primary)]"
      >
        Try again
      </button>
    </div>
  );
}
