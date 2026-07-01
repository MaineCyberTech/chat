"use client";

export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">An error occurred in the workspace view.</p>
      <button
        onClick={reset}
        className="bg-foreground text-background rounded-md px-4 py-2 text-sm"
      >
        Try again
      </button>
    </div>
  );
}
