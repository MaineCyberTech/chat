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

const PRESET_EMOJIS = ["ðŸ’¼", "ðŸ–ï¸", "ðŸš´", "ðŸ•", "ðŸ“ž", "ðŸŽ§", "âœˆï¸", "ðŸ ", "ðŸ’Š", "ðŸŽ‰"];

export function StatusModal({ onClose, currentStatus, onStatusChange }: Props) {
  const [emoji, setEmoji] = useState(currentStatus?.emoji ?? "ðŸ’¬");
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-label="Set custom status"
    >
      <div className="w-full max-w-sm rounded-lg bg-[var(--center-channel-bg)] p-6 shadow-[var(--elevation-4)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--center-channel-color)]">
            Set a status
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
            style={{ color: "var(--text-tertiary)" }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mb-3 flex gap-2">
          <div
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-[var(--center-channel-bg)] text-lg"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
            onClick={() => {
              const r = PRESET_EMOJIS[Math.floor(Math.random() * PRESET_EMOJIS.length)];
              if (r) setEmoji(r);
            }}
            title="Click to change emoji"
          >
            {emoji}
          </div>
          <input
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 100))}
            placeholder="What's your status?"
            className="flex-1 rounded-lg border bg-[var(--center-channel-bg)] px-3 py-2 text-sm text-[var(--center-channel-color)] placeholder:text-[rgba(var(--center-channel-color-rgb),0.56)] focus:border-[var(--button-bg)] focus:ring-2 focus:ring-[rgba(var(--button-bg-rgb),0.24)] focus:outline-none"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
            maxLength={100}
            autoFocus
          />
        </div>
        <div className="mb-3 flex flex-wrap gap-1">
          {PRESET_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`flex h-7 w-7 items-center justify-center rounded text-sm transition-colors ${
                emoji === e
                  ? "ring-2 ring-[var(--button-bg)]"
                  : "hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
              }`}
              title={e}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="mb-3">
          <p
            className="mb-1 text-xs font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
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
                    ? "bg-[var(--button-bg)] text-white"
                    : "bg-[rgba(var(--center-channel-color-rgb),0.08)] text-[rgba(var(--center-channel-color-rgb),0.72)] hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]")
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
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--dnd-indicator)] hover:bg-[rgba(var(--center-channel-color-rgb),0.08)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear status
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
            style={{
              borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
              color: "var(--text-secondary)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSet}
            disabled={saving || !text.trim()}
            className="rounded-lg bg-[var(--button-bg)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Set status"}
          </button>
        </div>
      </div>
    </div>
  );
}
