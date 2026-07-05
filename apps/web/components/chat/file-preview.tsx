"use client";

import { useState } from "react";
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
} from "lucide-react";

interface Props {
  url: string;
  type: "image" | "video" | "audio" | "file";
  name: string;
  files?: Array<{ url: string; type: string; name: string }>;
  fileIndex?: number;
  onNavigate?: (index: number) => void;
}

export function FilePreview({ url, type, name, files, fileIndex, onNavigate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(false);
  const [zoom, setZoom] = useState(1);

  function handleOpen(index?: number) {
    setExpanded(true);
    setZoom(1);
    if (typeof index === "number" && onNavigate) onNavigate(index);
  }

  function renderFullscreen() {
    const showNav = files && files.length > 1;
    const currentIdx = fileIndex ?? 0;
    const fileList = files ?? [];

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-black/80 p-4"
        onClick={() => setExpanded(false)}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <span className="font-medium">{name}</span>
            {type === "image" && (
              <span className="text-xs text-white/50">{Math.round(zoom * 100)}%</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {type === "image" && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom((z) => Math.max(0.25, z - 0.25));
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                  aria-label="Zoom out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom((z) => Math.min(3, z + 0.25));
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                  aria-label="Zoom in"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom(zoom === 1 ? 2 : 1);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                  aria-label="Toggle zoom"
                >
                  {zoom === 1 ? <Maximize size={16} /> : <Minimize size={16} />}
                </button>
              </>
            )}
            <a
              href={url}
              download={name}
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              aria-label={`Download ${name}`}
            >
              <Download size={16} />
            </a>
            <button
              onClick={() => setExpanded(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div
          className="flex flex-1 items-center justify-center overflow-auto"
          onClick={() => setExpanded(false)}
        >
          {showNav && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.(currentIdx - 1);
                setZoom(1);
              }}
              disabled={currentIdx <= 0}
              className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-30"
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {type === "image" && showNav && fileList[currentIdx] && (
            <img
              src={fileList[currentIdx].url}
              alt={fileList[currentIdx].name}
              className="max-h-[80vh] max-w-[85vw] rounded-lg object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
          )}
          {type === "image" && !showNav && (
            <img
              src={url}
              alt={name}
              className="max-h-[80vh] max-w-[85vw] rounded-lg object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
          )}
          {type === "video" && (
            <video controls className="max-h-[80vh] max-w-[90vw] rounded-lg" autoPlay>
              <source src={url} />
            </video>
          )}
          {type === "audio" && (
            <audio controls className="w-full max-w-md" autoPlay>
              <source src={url} />
            </audio>
          )}
          {showNav && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.(currentIdx + 1);
                setZoom(1);
              }}
              disabled={currentIdx >= fileList.length - 1}
              className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-30"
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Bottom file list */}
        {showNav && (
          <div className="flex items-center justify-center gap-2 py-2">
            {fileList.map((f, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate?.(i);
                  setZoom(1);
                }}
                className={`h-1.5 rounded-full transition-all ${i === currentIdx ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"}`}
                aria-label={`Go to file ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="my-1">
        <button
          onClick={() => handleOpen()}
          className="block max-w-xs overflow-hidden rounded-lg border transition-opacity hover:opacity-90"
          style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
        >
          <img src={url} alt={name} className="max-h-48 w-auto object-cover" loading="lazy" />
        </button>
        {expanded && renderFullscreen()}
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
