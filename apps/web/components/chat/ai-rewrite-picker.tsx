"use client";

import React from "react";
import { Sparkles } from "lucide-react";

const AI_ACTIONS = [
  { key: "fix-spelling", label: "Fix spelling & grammar" },
  { key: "shorter", label: "Make shorter" },
  { key: "formal", label: "Make formal" },
  { key: "concise", label: "Make concise" },
  { key: "friendly", label: "Make friendly" },
] as const;

interface Props {
  show: boolean;
  rewriting: boolean;
  onRewrite: (action: string) => void;
  onClose: () => void;
}

export function AiRewritePicker({ show, rewriting, onRewrite, onClose: _onClose }: Props) {
  if (!show) return null;

  return (
    <div
      className="absolute bottom-full left-1/2 z-30 mb-2 w-52 -translate-x-1/2 overflow-hidden rounded-lg border p-1 shadow-lg"
      style={{
        background: "var(--center-channel-bg)",
        borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
      }}
    >
      <div
        className="mb-1 px-3 py-1.5 text-xs font-semibold tracking-wider uppercase"
        style={{ color: "var(--text-tertiary)" }}
      >
        Rewrite with AI
      </div>
      {AI_ACTIONS.map((action) => (
        <button
          key={action.key}
          onClick={() => onRewrite(action.key)}
          disabled={rewriting}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors hover:bg-[rgba(0,0,0,0.04)] disabled:opacity-50"
          style={{ color: "var(--center-channel-color)" }}
        >
          <Sparkles size={14} style={{ color: "var(--text-tertiary)" }} />
          {action.label}
        </button>
      ))}
    </div>
  );
}
