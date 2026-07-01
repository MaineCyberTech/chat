export default function WorkspaceLoading() {
  return (
    <div className="flex h-screen">
      <div className="flex w-60 flex-col gap-2 border-r p-3">
        <div className="bg-muted h-8 animate-pulse rounded-md" />
        <div className="bg-muted h-8 animate-pulse rounded-md" />
        <div className="bg-muted h-8 animate-pulse rounded-md" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="bg-muted h-6 w-48 animate-pulse rounded" />
        <div className="bg-muted flex-1 animate-pulse rounded" />
      </div>
    </div>
  );
}
