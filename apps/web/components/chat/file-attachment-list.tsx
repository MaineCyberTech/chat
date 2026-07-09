"use client";

import React from "react";
import { File, X } from "lucide-react";

interface Props {
  files: File[];
  onRemove: (index: number) => void;
}

export function FileAttachmentList({ files, onRemove }: Props) {
  if (files.length === 0) return null;
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs"
          style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }}
        >
          <File size={14} />
          <span className="max-w-[120px] truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="ml-1 rounded-full p-0.5 hover:bg-[rgba(0,0,0,0.1)]"
            aria-label={`Remove ${file.name}`}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
