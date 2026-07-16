"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@chat/ui";
import { t } from "@/lib/i18n";

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

const OPTIONS: { value: "all" | "mentions" | "none"; label: () => string; desc: () => string }[] = [
  { value: "all", label: () => t("notificationModal.allMessages"), desc: () => t("notificationModal.allMessagesDesc") },
  { value: "mentions", label: () => t("notificationModal.mentionsOnly"), desc: () => t("notificationModal.mentionsOnlyDesc") },
  { value: "none", label: () => t("notificationModal.nothing"), desc: () => t("notificationModal.nothingDesc") },
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
  const [initialNotify, setInitialNotify] = useState(currentNotify);
  const [initialSound, setInitialSound] = useState(currentSound);
  const [initialNotifyEveryone, setInitialNotifyEveryone] = useState(currentNotifyEveryone ?? true);
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

  const hasChanges = notify !== initialNotify || sound !== initialSound || notifyEveryone !== initialNotifyEveryone;

  const handleClose = useCallback(() => {
    if (hasChanges) {
      if (!window.confirm(t("notificationModal.unsavedChanges"))) return;
    }
    onClose();
  }, [hasChanges, onClose]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleClose]);

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
        title: t("common.error"),
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
        aria-label={t("notificationModal.title")}
        className="w-full max-w-sm rounded-xl bg-[var(--center-channel-bg)] p-5 shadow-[var(--elevation-5)]"
      >
        <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>
          {t("notificationModal.title")}
        </h3>
        <p className="mb-4 text-xs" style={{ color: "var(--text-secondary)" }}>
          {t("notificationModal.description")}
        </p>

        <div className="mb-4 space-y-2" role="radiogroup" aria-label={t("notificationModal.title")}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="radio"
              aria-checked={notify === opt.value}
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
                <div className="font-medium">{opt.label()}</div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {opt.desc()}
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
            {t("notificationModal.enableSound")}
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
            {t("notificationModal.notifyEveryone")}
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
            onClick={handleClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
            style={{ background: "var(--button-bg)" }}
          >
            {saving ? t("notificationModal.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
