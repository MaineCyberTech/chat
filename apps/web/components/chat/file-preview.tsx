"use client";

import React, { useState } from "react";
import { FileText, Image, File, Download, X, ExternalLink } from "lucide-react";

interface FileInfo {
  name: string;
  url: string;
  type: "image" | "pdf" | "code" | "other";
  size?: number;
}

function getFileType(name: string, url: string): FileInfo["type"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) return "image";
  if (["pdf"].includes(ext)) return "pdf";
  if (["js", "ts", "tsx", "jsx", "py", "go", "rs", "rb", "java", "c", "cpp", "h", "css", "scss", "html", "json", "yaml", "toml", "sh", "bash", "sql", "md"].includes(ext)) return "code";
  return "other";
}

export function FilePreview({ name, url, type, size }: FileInfo) {
  const [showFull, setShowFull] = useState(false);
  const fileType = type ?? getFileType(name, url);

  if (fileType === "image") {
    return (
      <div className="group relative mt-1 inline-block max-w-xs">
        <button
          onClick={() => setShowFull(true)}
          className="block overflow-hidden rounded-lg border border-[var(--color-border)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none"
          aria-label={`View ${name} full size`}
        >
          <img
            src={url}
            alt={name}
            className="max-h-48 w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-dialog-bg)]/80 text-[var(--color-foreground-secondary)] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:text-[var(--color-foreground-primary)]"
          aria-label={`Download ${name}`}
        >
          <Download size={14} />
        </a>

        {showFull && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-dialog-overlay)] p-4"
            onClick={() => setShowFull(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`Image preview: ${name}`}
          >
            <button
              onClick={() => setShowFull(false)}
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-dialog-bg)] text-[var(--color-foreground-secondary)] shadow-lg hover:text-[var(--color-foreground-primary)]"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
            <img
              src={url}
              alt={name}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-2 text-sm text-[var(--color-foreground-primary)] transition-colors hover:bg-[var(--color-background-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none"
    >
      {fileType === "pdf" ? <FileText size={16} /> : <File size={16} />}
      <span className="max-w-[200px] truncate">{name}</span>
      {size && (
        <span className="text-xs text-[var(--color-foreground-tertiary)]">
          {size > 1024 * 1024
            ? `${(size / (1024 * 1024)).toFixed(1)} MB`
            : `${(size / 1024).toFixed(0)} KB`}
        </span>
      )}
      <ExternalLink size={12} className="text-[var(--color-foreground-tertiary)]" />
    </a>
  );
}
