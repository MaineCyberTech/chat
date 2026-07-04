"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@chat/ui";
import { Clock, X } from "lucide-react";

const PRESETS = [
  { label: "30 minutes", ms: 30 * 60 * 1000 },
  { label: "1 hour", ms: 60 * 60 * 1000 },
  { label: "4 hours", ms: 4 * 60 * 60 * 1000 },
  { label: "Tomorrow", ms: 24 * 60 * 60 * 1000 },
  { label: "Next week", ms: 7 * 24 * 60 * 60 * 1000 },
];

interface Props {
  messageId: string;
  onClose: () => void;
}

export function RemindModal({ messageId, onClose }: Props) {
  const { addToast } = useToast();
  const [customDate, setCustomDate] = useState("");

  async function setReminder(ms: number) {
    try {
      await api.post(`/messages/${messageId}/remind`, {
        remindAt: new Date(Date.now() + ms).toISOString(),
      });
      addToast({ title: "Reminder set", variant: "success", duration: 3000 });
      onClose();
    } catch {
      addToast({ title: "Failed to set reminder", variant: "error" });
    }
  }

  async function setCustom() {
    if (!customDate) return;
    try {
      await api.post(`/messages/${messageId}/remind`, {
        remindAt: new Date(customDate).toISOString(),
      });
      addToast({ title: "Reminder set", variant: "success", duration: 3000 });
      onClose();
    } catch {
      addToast({ title: "Failed to set reminder", variant: "error" });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-dialog-overlay)]"
      onClick={onClose}
    >
      <div
        className="w-64 rounded-lg bg-[var(--color-dialog-bg)] p-4 shadow-[var(--shadow-xl)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Set reminder"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--color-foreground-primary)]">
            Remind me
          </h3>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)]"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="space-y-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setReminder(p.ms)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--color-foreground-primary)] transition-colors hover:bg-[var(--color-background-tertiary)]"
            >
              <Clock size={14} className="text-[var(--color-foreground-tertiary)]" />
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-3 border-t border-[var(--color-border-primary)] pt-3">
          <p className="mb-1 text-xs text-[var(--color-foreground-tertiary)]">Custom date/time</p>
          <input
            type="datetime-local"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1 text-xs text-[var(--color-input-fg)] focus:border-[var(--color-input-border-focus)] focus:ring-1 focus:ring-[var(--color-input-focus-ring)] focus:outline-none"
          />
          <button
            onClick={setCustom}
            disabled={!customDate}
            className="mt-2 w-full rounded bg-[var(--color-brand-primary)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            Set custom
          </button>
        </div>
      </div>
    </div>
  );
}
