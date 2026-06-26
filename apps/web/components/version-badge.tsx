"use client";

import { useEffect, useState } from "react";

export function VersionBadge() {
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    fetch("/version.json")
      .then((res) => res.json())
      .then((data) =>
        setVersion(`${data.branch}-${data.run} • ${data.sha.slice(0, 7)} • ${data.date}`),
      )
      .catch(() => setVersion("dev"));
  }, []);

  if (!version) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 9999,
        fontSize: 10,
        fontFamily: "monospace",
        background: "rgba(0,0,0,0.7)",
        color: "#fff",
        padding: "4px 8px",
        borderRadius: 4,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {version}
    </div>
  );
}
