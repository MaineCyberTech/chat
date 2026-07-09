export default function WorkspaceLoading() {
  return (
    <div
      className="app__body"
      style={{
        flex: 1,
        display: "grid",
        gridTemplateRows: "1fr",
        background: "var(--sidebar-bg)",
        minHeight: 0,
      }}
    >
      <div style={{ display: "flex", overflow: "clip", minHeight: 0 }}>
        {/* Mobile header skeleton */}
        <div
          className="flex items-center gap-2 px-3 md:hidden"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            paddingTop: "env(safe-area-inset-top, 0px)",
            height: "calc(3rem + env(safe-area-inset-top, 0px))",
            background: "var(--sidebar-header-bg)",
          }}
        >
          <div
            className="h-6 w-6 animate-pulse rounded"
            style={{ background: "rgba(var(--center-channel-color-rgb), 0.12)" }}
          />
          <div
            className="h-4 w-24 animate-pulse rounded"
            style={{ background: "rgba(var(--center-channel-color-rgb), 0.12)" }}
          />
        </div>

        {/* Sidebar skeleton */}
        <div className="hidden md:flex" style={{ width: 280, minWidth: 200, flexShrink: 0 }}>
          <div className="flex w-full flex-col gap-2 p-3" style={{ overflow: "hidden auto" }}>
            <div
              className="mb-4 h-4 w-20 animate-pulse rounded"
              style={{ background: "rgba(var(--center-channel-color-rgb), 0.12)" }}
            />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <div
                  className="h-3 w-3 animate-pulse rounded"
                  style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)" }}
                />
                <div
                  className="h-3 flex-1 animate-pulse rounded"
                  style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Main content skeleton */}
        <div
          className="flex flex-1 flex-col items-center justify-center gap-4 p-8"
          style={{ background: "var(--center-channel-bg)" }}
        >
          <div
            className="h-6 w-32 animate-pulse rounded"
            style={{ background: "rgba(var(--center-channel-color-rgb), 0.1)" }}
          />
          <div
            className="h-16 w-3/4 animate-pulse rounded"
            style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }}
          />
          <div
            className="h-16 w-2/3 animate-pulse rounded"
            style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }}
          />
        </div>
      </div>
    </div>
  );
}
