"use client";

export default function AuthError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">An error occurred on the authentication page.</p>
      <button
        onClick={reset}
        className="bg-foreground text-background rounded-md px-4 py-2 text-sm"
      >
        Try again
      </button>
    </div>
  );
}
