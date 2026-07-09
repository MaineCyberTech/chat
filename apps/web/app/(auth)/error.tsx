"use client";

export default function AuthError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4"
      style={{ backgroundColor: "var(--center-channel-bg)" }}
    >
      <h2 className="text-xl font-semibold" style={{ color: "var(--center-channel-color)" }}>
        Something went wrong
      </h2>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        An error occurred on the authentication page.
      </p>
      <button
        onClick={reset}
        className="rounded-md px-4 py-2 text-sm"
        style={{
          backgroundColor: "var(--center-channel-color)",
          color: "var(--center-channel-bg)",
        }}
      >
        Try again
      </button>
    </div>
  );
}
