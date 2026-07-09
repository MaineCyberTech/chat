"use client";

import React from "react";
import { Flag, AlertCircle, AlertTriangle } from "lucide-react";

export type PostPriority = "standard" | "important" | "urgent" | "critical";

export const PRIORITY_CONFIG: Record<PostPriority, { color: string }> = {
  standard: { color: "rgba(var(--center-channel-color-rgb), 0.56)" },
  important: { color: "#f59e0b" },
  urgent: { color: "#ef4444" },
  critical: { color: "#dc2626" },
};

export const PRIORITY_OPTIONS: { key: PostPriority; label: string; icon: React.ReactNode; description: string }[] = [
  { key: "standard", label: "Standard", icon: <Flag size={16} />, description: "Normal message" },
  { key: "important", label: "Important", icon: <AlertCircle size={16} />, description: "Needs attention" },
  { key: "urgent", label: "Urgent", icon: <AlertTriangle size={16} />, description: "Time-sensitive" },
  { key: "critical", label: "Critical", icon: <AlertTriangle size={16} />, description: "Requires immediate action" },
];

interface Props {
  priority: PostPriority;
  show: boolean;
  onSelect: (p: PostPriority) => void;
  onClose: () => void;
}

export function PriorityPicker({ priority: current, show, onSelect, onClose: _onClose }: Props) {
  if (!show) return null;

  return (
    <div className="absolute bottom-full left-0 z-30 mb-2 w-48 overflow-hidden rounded-lg border p-1 shadow-lg"
      style={{ background: "var(--center-channel-bg)", borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
    >
      {PRIORITY_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onSelect(opt.key)}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-[rgba(0,0,0,0.04)]"
          style={{
            background: current === opt.key ? "rgba(var(--button-bg-rgb), 0.08)" : "transparent",
            color: current === opt.key ? "var(--button-bg)" : "var(--center-channel-color)",
          }}
          role="option"
          aria-selected={current === opt.key}
        >
          <span style={{ color: current === opt.key ? "var(--button-bg)" : "rgba(var(--center-channel-color-rgb), 0.56)" }}>
            {opt.icon}
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-medium">{opt.label}</span>
            <span className="text-[10px]" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
              {opt.description}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
