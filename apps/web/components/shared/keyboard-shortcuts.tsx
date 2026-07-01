"use client";

import { useEffect, useState } from "react";

const SHORTCUTS = [
  { keys: "Ctrl+K", label: "Open search / command palette" },
  { keys: "Ctrl+1-9", label: "Switch workspace" },
  { keys: "Ctrl+Shift+Up", label: "Previous channel" },
  { keys: "Ctrl+Shift+Down", label: "Next channel" },
  { keys: "Escape", label: "Close dialog / cancel reply" },
  { keys: "Enter", label: "Send message" },
  { keys: "Shift+Enter", label: "New line in message" },
  { keys: "Ctrl+B", label: "Bold text" },
  { keys: "Ctrl+I", label: "Italic text" },
  { keys: "?", label: "Show keyboard shortcuts" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (
        e.key === "?" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        setOpen((p) => !p);
      }
      if (e.key === "Escape" && open) setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="w-full max-w-md rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] p-6 shadow-[var(--shadow-xl)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground-primary)]">
          Keyboard Shortcuts
        </h2>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-foreground-primary)]">{s.label}</span>
              <kbd className="rounded-md border border-[var(--color-border-primary)] bg-[var(--color-background-tertiary)] px-2 py-0.5 font-mono text-xs text-[var(--color-foreground-primary)]">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
        <button
          onClick={() => setOpen(false)}
          className="mt-4 w-full rounded-md bg-[var(--color-foreground-primary)] py-2 text-sm text-[var(--color-background-primary)]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
