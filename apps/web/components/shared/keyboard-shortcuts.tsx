"use client";

import { useEffect, useState, useRef } from "react";
import { getCallback } from "@/lib/keyboard-shortcut-registry";

const SHORTCUTS = [
  { keys: "Ctrl+K", label: "Open search / command palette" },
  { keys: "Ctrl+1-9", label: "Switch workspace" },
  { keys: "Ctrl+Shift+Up", label: "Previous channel" },
  { keys: "Ctrl+Shift+Down", label: "Next channel" },
  { keys: "Escape", label: "Close dialog / cancel reply" },
  { keys: "Enter", label: "Send message" },
  { keys: "Shift+Enter", label: "New line in message" },
  { keys: "?", label: "Show keyboard shortcuts" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Open/close keyboard shortcuts dialog
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      const mod = e.ctrlKey || e.metaKey;

      if (e.key === "?" && !mod && !isInput) {
        e.preventDefault();
        setOpen((p) => !p);
        return;
      }

      if (e.key === "Escape" && open) {
        setOpen(false);
        return;
      }

      const searchOpen = getCallback("searchOpen");
      const channelUp = getCallback("channelUp");
      const channelDown = getCallback("channelDown");

      if (e.key === "k" && mod && !e.shiftKey && searchOpen) {
        e.preventDefault();
        searchOpen();
        return;
      }

      if (e.key === "ArrowUp" && mod && e.shiftKey && channelUp) {
        e.preventDefault();
        channelUp();
        return;
      }

      if (e.key === "ArrowDown" && mod && e.shiftKey && channelDown) {
        e.preventDefault();
        channelDown();
        return;
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Focus trap when dialog is open
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const container = dialogRef.current;
    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusable = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleTab);
    container.querySelector<HTMLElement>("button")?.focus();
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={() => setOpen(false)}
      onTouchStart={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        ref={dialogRef}
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
