export default function WorkspaceLoading() {
  return (
    <div className="flex h-screen bg-[var(--color-background-primary)]">
      <div className="flex w-60 flex-col gap-2 border-r border-[var(--color-border-primary)] p-3">
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
