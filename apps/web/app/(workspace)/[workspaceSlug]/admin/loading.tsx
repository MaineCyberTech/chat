export default function AdminLoading() {
  return (
    <div className="flex h-full animate-pulse" role="status" aria-busy="true" style={{ padding: "24px 32px" }}>
      <div className="flex w-full gap-6">
        <div className="w-48 space-y-3">
          <div className="h-4 w-24 rounded bg-[var(--color-skeleton-bg)]" />
          <div className="h-4 w-32 rounded bg-[var(--color-skeleton-bg)]" />
          <div className="h-4 w-28 rounded bg-[var(--color-skeleton-bg)]" />
          <div className="h-4 w-36 rounded bg-[var(--color-skeleton-bg)]" />
          <div className="h-4 w-20 rounded bg-[var(--color-skeleton-bg)]" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-8 w-48 rounded bg-[var(--color-skeleton-bg)]" />
          <div className="h-64 w-full rounded bg-[var(--color-skeleton-bg)]" />
          <div className="flex gap-4">
            <div className="h-32 flex-1 rounded bg-[var(--color-skeleton-bg)]" />
            <div className="h-32 flex-1 rounded bg-[var(--color-skeleton-bg)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
