export default function WorkspaceLoading() {
  return (
    <div className="flex h-screen" role="status" aria-busy="true" style={{ backgroundColor: "var(--center-channel-bg)" }}>
      <div
        className="hidden md:flex w-60 flex-col gap-2 border-r p-3"
        style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
      >
        <div className="h-8 animate-pulse rounded-md bg-[var(--color-skeleton-bg)]" />
        <div className="h-8 animate-pulse rounded-md bg-[var(--color-skeleton-bg)]" />
        <div className="h-8 animate-pulse rounded-md bg-[var(--color-skeleton-bg)]" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="h-6 w-48 animate-pulse rounded bg-[var(--color-skeleton-bg)]" />
        <div className="flex-1 animate-pulse rounded bg-[var(--color-skeleton-bg)]" />
      </div>
    </div>
  );
}
