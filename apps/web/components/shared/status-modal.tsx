"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@chat/ui";
import { X } from "lucide-react";

const DURATIONS = [
  { value: "30m", label: "30 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "4h", label: "4 hours" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
] as const;

interface StatusData {
  emoji: string;
  text: string;
  expires_at: string | null;
}

interface Props {
  onClose: () => void;
  currentStatus?: StatusData | null;
  onStatusChange: (status: StatusData | null) => void;
}

export function StatusModal({ onClose, currentStatus, onStatusChange }: Props) {
  const [emoji] = useState(currentStatus?.emoji ?? "??");
  const [text, setText] = useState(currentStatus?.text ?? "");
  const [duration, setDuration] = useState<string>("1h");
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  async function handleSet() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await api.put<{ status: StatusData }>("/status", {
        emoji,
        text: text.trim(),
        duration,
      });
      onStatusChange(res.status);
      addToast({ title: "Status set", variant: "success", duration: 3000 });
      onClose();
    } catch {
      addToast({ title: "Error", description: "Failed to set status", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setSaving(true);
    try {
      await api.delete("/status");
      onStatusChange(null);
      addToast({ title: "Status cleared", variant: "success", duration: 3000 });
      onClose();
    } catch {
      addToast({ title: "Error", description: "Failed to clear status", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-dialog-overlay)] p-4"
      role="dialog"
      aria-label="Set custom status"
    >
      <div className="w-full max-w-sm rounded-lg bg-[var(--color-dialog-bg)] p-6 shadow-[var(--shadow-xl)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-foreground-primary)]">
            Set a status
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mb-3 flex gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] text-lg">
            {emoji}
          </div>
          <input
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 100))}
            placeholder="What's your status?"
            className="flex-1 rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-input-fg)] placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-input-border-focus)] focus:ring-2 focus:ring-[var(--color-input-focus-ring)] focus:outline-none"
            maxLength={100}
            autoFocus
          />
        </div>
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-[var(--color-foreground-tertiary)]">
            Clear after
          </p>
          <div className="flex flex-wrap gap-1">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className={
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors " +
                  (duration === d.value
                    ? "bg-[var(--color-brand-primary)] text-white"
                    : "bg-[var(--color-background-tertiary)] text-[var(--color-foreground-secondary)] hover:bg-[var(--color-background-tertiary)]")
                }
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          {currentStatus && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-status-danger-fg)] hover:bg-[var(--color-background-tertiary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear status
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--color-border-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-foreground-secondary)] hover:bg-[var(--color-background-tertiary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSet}
            disabled={saving || !text.trim()}
            className="rounded-lg bg-[var(--color-brand-primary)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Set status"}
          </button>
        </div>
      </div>
    </div>
  );
}
