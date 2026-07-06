"use client";

import { useState, useCallback, useRef } from "react";
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Image,
  FileText,
  Film,
  Music,
  Calendar,
  HardDrive,
} from "lucide-react";

interface FileEntry {
  url: string;
  type: string;
  name: string;
}

interface Props {
  url: string;
  type: "image" | "video" | "audio" | "file";
  name: string;
  files?: Array<FileEntry>;
  fileIndex?: number;
  onNavigate?: (index: number) => void;
  fileSize?: number;
  uploadedAt?: string;
}

function formatSize(bytes?: number): string {
  if (bytes == null) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function typeIcon(t: string) {
  if (t === "image") return <Image size={14} />;
  if (t === "video") return <Film size={14} />;
  if (t === "audio") return <Music size={14} />;
  return <FileText size={14} />;
}

function clampZoom(z: number) {
  return Math.min(5, Math.max(0.25, Math.round(z * 4) / 4));
}

export function FilePreview({
  url,
  type,
  name,
  files,
  fileIndex,
  onNavigate,
  fileSize,
  uploadedAt,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOrigin = useRef({ x: 0, y: 0 });

  const handleOpen = useCallback(() => {
    setExpanded(true);
    setZoom(1);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const navigate = useCallback(
    (nextIdx: number) => {
      onNavigate?.(nextIdx);
      setZoom(1);
      setDragOffset({ x: 0, y: 0 });
    },
    [onNavigate],
  );

  const resetZoom = useCallback(() => {
    setZoom(1);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const fitToWindow = useCallback(() => {
    setZoom((z) => (z === 1 ? 0.5 : 1));
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom <= 1) return;
      e.preventDefault();
      dragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      dragOrigin.current = { x: dragOffset.x, y: dragOffset.y };
    },
    [zoom, dragOffset],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current) return;
      const dx = dragOrigin.current.x + (e.clientX - dragStart.current.x);
      const dy = dragOrigin.current.y + (e.clientY - dragStart.current.y);
      setDragOffset({ x: dx, y: dy });
    },
    [],
  );

  const onMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const imageStyle = {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${zoom})`,
    cursor: zoom > 1 ? "grab" : "default",
  };

  const showMeta = fileSize != null || uploadedAt != null;
  const showNav = !!files && files.length > 1;
  const currentIdx = fileIndex ?? 0;
  const fileList = files ?? [];
  const currentFile = showNav && fileList[currentIdx];

  function renderImage(src: string, alt: string) {
    return (
      <img
        src={src}
        alt={alt}
        className="max-h-[80vh] max-w-[85vw] rounded-lg object-contain select-none transition-transform duration-200"
        style={imageStyle}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        draggable={false}
      />
    );
  }

  function renderFullscreen() {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-black/80"
        onClick={() => setExpanded(false)}
      >
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 truncate text-sm text-white/70">
            {showNav && (
              <span className="mr-1 shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-xs tabular-nums">
                {currentIdx + 1} of {fileList.length}
              </span>
            )}
            <span className="truncate font-medium">{name}</span>
            {type === "image" && (
              <span className="shrink-0 text-xs text-white/50">{Math.round(zoom * 100)}%</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {type === "image" && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom((z) => clampZoom(z - 0.25));
                  }}
                  disabled={zoom <= 0.25}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-30"
                  aria-label="Zoom out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom((z) => clampZoom(z + 0.25));
                  }}
                  disabled={zoom >= 5}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-30"
                  aria-label="Zoom in"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetZoom();
                  }}
                  disabled={zoom === 1 && dragOffset.x === 0 && dragOffset.y === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-30"
                  aria-label="Reset zoom"
                >
                  <Minimize size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fitToWindow();
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/30 ${zoom === 0.5 ? "bg-white/40" : "bg-white/20"}`}
                  aria-label="Fit to window"
                >
                  <Maximize size={16} />
                </button>
              </>
            )}
            <a
              href={showNav && currentFile ? currentFile.url : url}
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
          className="relative flex flex-1 items-center justify-center overflow-hidden"
          onClick={() => setExpanded(false)}
        >
          {showNav && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(currentIdx - 1);
              }}
              disabled={currentIdx <= 0}
              className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-30"
              aria-label="Previous file"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {type === "image" && currentFile
            ? renderImage(currentFile.url, currentFile.name)
            : type === "image" && !showNav
              ? renderImage(url, name)
              : null}
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
                navigate(currentIdx + 1);
              }}
              disabled={currentIdx >= fileList.length - 1}
              className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-30"
              aria-label="Next file"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Dots */}
        {showNav && (
          <div className="flex shrink-0 items-center justify-center gap-2 py-2">
            {fileList.map((f, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(i);
                }}
                className={`h-1.5 rounded-full transition-all ${i === currentIdx ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"}`}
                aria-label={`Go to file ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Metadata bar */}
        {showMeta && (
          <div className="flex shrink-0 items-center gap-4 border-t border-white/10 px-4 py-2.5 text-xs text-white/60">
            {fileSize != null && (
              <span className="flex items-center gap-1.5">
                <HardDrive size={12} />
                {formatSize(fileSize)}
              </span>
            )}
            {uploadedAt != null && (
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {formatDate(uploadedAt)}
              </span>
            )}
            {type !== "file" && (
              <span className="flex items-center gap-1.5 capitalize">
                {typeIcon(type)}
                {type}
              </span>
            )}
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
