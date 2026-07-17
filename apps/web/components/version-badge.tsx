"use client";

import { APP_VERSION, GIT_SHA, BUILD_TIME } from "@/lib/version";

export function VersionBadge() {
  const shortSha = GIT_SHA.length > 7 ? GIT_SHA.slice(0, 7) : GIT_SHA;
  const buildDate = new Date(BUILD_TIME).toLocaleDateString();

  return (
    <div
      className="fixed top-2 left-2 z-40 flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-xs shadow-sm backdrop-blur-sm select-none"
      style={{
        borderColor: "rgba(var(--center-channel-color-rgb), 0.08)",
        backgroundColor: "rgba(var(--center-channel-color-rgb), 0.032)",
        color: "var(--text-tertiary)",
      }}
    >
      <span className="opacity-60">v</span>
      <span>{APP_VERSION}</span>
      <span className="opacity-40">·</span>
      <span title={GIT_SHA}>{shortSha}</span>
      <span className="opacity-40">·</span>
      <span title={BUILD_TIME}>{buildDate}</span>
    </div>
  );
}
