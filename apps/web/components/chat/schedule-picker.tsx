"use client";

import React, { useState } from "react";
import { Clock } from "lucide-react";

const PRESETS = [
  { label: "In 30 minutes", getValue: () => new Date(Date.now() + 30 * 60 * 1000).toISOString() },
  { label: "In 1 hour", getValue: () => new Date(Date.now() + 60 * 60 * 1000).toISOString() },
  { label: "In 4 hours", getValue: () => new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() },
  { label: "Tomorrow morning", getValue: () => {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.toISOString();
  }},
  { label: "Tomorrow afternoon", getValue: () => {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(13, 0, 0, 0); return d.toISOString();
  }},
  { label: "Next week", getValue: () => {
    const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(9, 0, 0, 0); return d.toISOString();
  }},
];

interface Props {
  scheduledAt: string;
  show: boolean;
  onSchedule: (iso: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function SchedulePicker({ scheduledAt, show, onSchedule, onClear, onClose: _onClose }: Props) {
  const [customDate, setCustomDate] = useState("");

  if (!show) return null;

  function handlePreset(preset: { getValue: () => string }) {
    onSchedule(preset.getValue());
  }

  function handleCustom() {
    if (customDate) {
      onSchedule(new Date(customDate).toISOString());
    }
  }

  return (
    <div className="absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 overflow-hidden rounded-lg border p-3 shadow-lg"
      style={{ background: "var(--center-channel-bg)", borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
      >
        <Clock size={14} /> Schedule message
      </div>

      <div className="mb-2 flex flex-col gap-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePreset(preset)}
            className="rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-[rgba(0,0,0,0.04)]"
            style={{ color: "var(--center-channel-color)" }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t pt-2"
        style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.12)" }}
      >
        <input
          type="datetime-local"
          value={customDate}
          onChange={(e) => setCustomDate(e.target.value)}
          className="flex-1 rounded border px-2 py-1 text-xs"
          style={{
            background: "var(--center-channel-bg)",
            borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
            color: "var(--center-channel-color)",
          }}
        />
        <button
          onClick={handleCustom}
          disabled={!customDate}
          className="rounded-md px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
          style={{ background: "var(--button-bg)" }}
        >
          Set
        </button>
      </div>

      {scheduledAt && (
        <button
          onClick={onClear}
          className="mt-2 w-full rounded-md px-2 py-1 text-xs transition-colors"
          style={{ color: "var(--error-text)" }}
        >
          Clear schedule
        </button>
      )}
    </div>
  );
}
