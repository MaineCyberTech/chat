"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useToast } from "@chat/ui";

interface Props {
  channelId: string;
  onClose: () => void;
  currentNotify?: "all" | "mentions" | "none";
  currentSound?: boolean;
  currentNotifyEveryone?: boolean;
  onSave?: (prefs: {
    notify: "all" | "mentions" | "none";
    sound: boolean;
    notifyEveryone: boolean;
  }) => void;
}

const NOTIFY_OPTIONS: { value: "all" | "mentions" | "none"; label: string; desc: string }[] = [
  { value: "all", label: "All messages", desc: "Notify on every message" },
  { value: "mentions", label: "Mentions only", desc: "Only when you're mentioned" },
  { value: "none", label: "Nothing", desc: "Mute this channel" },
];

export function NotificationPreferencesModal({
  channelId,
  onClose,
  currentNotify = "all",
  currentSound = true,
  currentNotifyEveryone = true,
  onSave,
}: Props) {
  const [notify, setNotify] = useState<"all" | "mentions" | "none">(currentNotify);
  const [sound, setSound] = useState(currentSound);
  const [notifyEveryone, setNotifyEveryone] = useState<boolean>(currentNotifyEveryone ?? true);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const prev = document.activeElement as HTMLElement | null;
    const first = el.querySelector<HTMLElement>("button, [tabindex]:not([tabindex='-1'])");
    first?.focus();
    return () => prev?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/channels/${channelId}/notification-preferences`, {
        notify,
        sound,
        notifyEveryone,
      });
      onSave?.({ notify, sound, notifyEveryone });
      onClose();
    } catch {
      addToast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "error",
      });
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notification preferences"
        className="w-full max-w-sm rounded-xl bg-[var(--center-channel-bg)] p-5 shadow-[var(--elevation-5)]"
      >
        <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>
          Notification Preferences
        </h3>
        <p className="mb-4 text-xs" style={{ color: "var(--text-secondary)" }}>
          Configure notifications for this channel
        </p>

        <div className="mb-4 space-y-2">
          {NOTIFY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setNotify(opt.value)}
              className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors"
              style={{
                background:
                  notify === opt.value ? "rgba(var(--button-bg-rgb), 0.08)" : "transparent",
                color: "var(--center-channel-color)",
              }}
            >
              <span
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]"
                style={{
                  borderColor:
                    notify === opt.value
                      ? "var(--button-bg)"
                      : "rgba(var(--center-channel-color-rgb), 0.3)",
                  background: notify === opt.value ? "var(--button-bg)" : "transparent",
                  color: notify === opt.value ? "var(--button-color)" : "transparent",
                }}
              >
                {notify === opt.value ? "\u2713" : ""}
              </span>
              <div>
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {opt.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div
          className="mb-5 flex items-center justify-between rounded-md px-3 py-2"
          style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}
        >
          <label className="text-sm" style={{ color: "var(--center-channel-color)" }}>
            Notification sound
          </label>
          <button
            role="switch"
            aria-checked={sound}
            onClick={() => setSound(!sound)}
            className="relative h-5 w-9 rounded-full transition-colors"
            style={{
              background: sound ? "var(--button-bg)" : "rgba(var(--center-channel-color-rgb), 0.2)",
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
              style={{ transform: sound ? "translateX(16px)" : "translateX(0)" }}
            />
          </button>
        </div>

        <div
          className="mb-5 flex items-center justify-between rounded-md px-3 py-2"
          style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}
        >
          <label className="text-sm" style={{ color: "var(--center-channel-color)" }}>
            Notify for <strong>@everyone</strong>
          </label>
          <button
            role="switch"
            aria-checked={notifyEveryone}
            onClick={() => setNotifyEveryone(!notifyEveryone)}
            className="relative h-5 w-9 rounded-full transition-colors"
            style={{
              background: notifyEveryone
                ? "var(--button-bg)"
                : "rgba(var(--center-channel-color-rgb), 0.2)",
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
              style={{ transform: notifyEveryone ? "translateX(16px)" : "translateX(0)" }}
            />
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
            style={{ background: "var(--button-bg)" }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
