export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2"
        style={{
          borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
          borderTopColor: "var(--button-bg)",
        }}
      />
    </div>
  );
}
