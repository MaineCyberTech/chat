export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-busy="true">
      <div
        className="flex w-full max-w-sm animate-pulse flex-col gap-4 rounded-lg border p-6"
        style={{
          borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
          backgroundColor: "var(--center-channel-bg)",
        }}
      >
        <div className="h-6 w-32 rounded bg-[var(--color-skeleton-bg)]" />
        <div className="h-10 w-full rounded bg-[var(--color-skeleton-bg)]" />
        <div className="h-10 w-full rounded bg-[var(--color-skeleton-bg)]" />
      </div>
    </div>
  );
}
