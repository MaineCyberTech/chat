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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-64 rounded-lg bg-[var(--center-channel-bg)] p-4 shadow-[var(--elevation-4)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Set reminder"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--center-channel-color)]">Remind me</h3>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
            style={{ color: "var(--text-tertiary)" }}
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
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--center-channel-color)] transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
            >
              <Clock size={14} style={{ color: "var(--text-tertiary)" }} />
              {p.label}
            </button>
          ))}
        </div>
        <div
          className="mt-3 border-t pt-3"
          style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
        >
          <p className="mb-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
            Custom date/time
          </p>
          <input
            type="datetime-local"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full rounded border bg-[var(--center-channel-bg)] px-2 py-1 text-xs text-[var(--center-channel-color)] focus:border-[var(--button-bg)] focus:ring-1 focus:ring-[rgba(var(--button-bg-rgb),0.24)] focus:outline-none"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
          />
          <button
            onClick={setCustom}
            disabled={!customDate}
            className="mt-2 w-full rounded px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--button-bg)" }}
          >
            Set custom
          </button>
        </div>
      </div>
    </div>
  );
}
