"use client";

import { useState } from "react";
import { X, Download } from "lucide-react";

interface Props {
  url: string;
  type: "image" | "video" | "audio" | "file";
  name: string;
}

export function FilePreview({ url, type, name }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(false);

  if (type === "image") {
    return (
      <div className="my-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="block max-w-xs overflow-hidden rounded-lg border transition-opacity hover:opacity-90"
          style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
        >
          <img src={url} alt={name} className="max-h-48 w-auto object-cover" loading="lazy" />
        </button>
        {expanded && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setExpanded(false)}
          >
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
            <img
              src={url}
              alt={name}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="my-1 max-w-md">
        <video
          controls
          className="w-full rounded-lg border"
          style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
          preload="metadata"
        >
          <source src={url} />
        </video>
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div className="my-1 max-w-sm">
        <audio controls className="w-full" preload="none">
          <source src={url} />
        </audio>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="my-1 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
      style={{
        borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
        color: "var(--button-bg)",
        backgroundColor: hoveredLink ? "rgba(var(--center-channel-color-rgb), 0.08)" : undefined,
      }}
      onMouseEnter={() => setHoveredLink(true)}
      onMouseLeave={() => setHoveredLink(false)}
    >
      <Download size={14} />
      {name}
    </a>
  );
}
