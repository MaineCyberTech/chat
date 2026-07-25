"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { EmptyState } from "@chat/ui";
import { getCallback } from "@/lib/keyboard-shortcut-registry";
import { t } from "@/lib/i18n";

const SHORTCUT_CATEGORIES = [
  {
    nameKey: "navigation",
    shortcuts: [
      { keys: "Ctrl+K", labelKey: "openSearch" },
      { keys: "Ctrl+Shift+F", labelKey: "channelSearch" },
      { keys: "Ctrl+Shift+Up", labelKey: "previousChannel" },
      { keys: "Ctrl+Shift+Down", labelKey: "nextChannel" },
      { keys: "Escape", labelKey: "closeDialog" },
    ],
  },
  {
    nameKey: "messaging",
    shortcuts: [
      { keys: "Enter", labelKey: "sendMessage" },
      { keys: "Shift+Enter", labelKey: "newLine" },
      { keys: "Ctrl+Shift+\\", labelKey: "createSlashCommand" },
    ],
  },
  {
    nameKey: "formatting",
    shortcuts: [
      { keys: "Ctrl+B", labelKey: "bold" },
      { keys: "Ctrl+I", labelKey: "italic" },
      { keys: "Ctrl+Shift+X", labelKey: "strikethrough" },
      { keys: "Ctrl+K", labelKey: "insertLink" },
    ],
  },
  {
    nameKey: "general",
    shortcuts: [
      { keys: "?", labelKey: "showShortcuts" },
      { keys: "Ctrl+Shift+/", labelKey: "showMarkdownHelp" },
    ],
  },
];

const isMac = typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");
const modKey = isMac ? "⌘" : "Ctrl";
const altKey = isMac ? "⌥" : "Alt";

function replaceModKeys(keys: string): string {
  return keys.replace(/\bCtrl\b/g, modKey).replace(/\bAlt\b/g, altKey);
}

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return SHORTCUT_CATEGORIES;
    const q = search.toLowerCase();
    return SHORTCUT_CATEGORIES.map((cat) => ({
      ...cat,
      shortcuts: cat.shortcuts.filter(
        (s) =>
          t(`keyboardShortcuts.${s.labelKey}`).toLowerCase().includes(q) ||
          s.keys.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.shortcuts.length > 0);
  }, [search]);

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
      const channelSearch = getCallback("channelSearch");
      const channelUp = getCallback("channelUp");
      const channelDown = getCallback("channelDown");

      if (e.key === "k" && mod && !e.shiftKey && searchOpen) {
        e.preventDefault();
        searchOpen();
        return;
      }

      if (e.key === "F" && mod && e.shiftKey && channelSearch) {
        e.preventDefault();
        channelSearch();
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
    searchRef.current?.focus();
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  // Listen for sidebar "?" button click to open
  useEffect(() => {
    function handler() {
      setOpen(true);
    }
    document.addEventListener("chat:open-shortcuts", handler);
    return () => document.removeEventListener("chat:open-shortcuts", handler);
  }, []);

  // Clear search when dialog closes
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={() => setOpen(false)}
      onTouchStart={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label={t("keyboardShortcuts.title")}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-lg border bg-[var(--center-channel-bg)] p-6 shadow-[var(--elevation-4)]"
        style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-[var(--center-channel-color)]">
          {t("keyboardShortcuts.title")}
        </h2>

        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("keyboardShortcuts.searchPlaceholder")}
          className="mb-4 w-full rounded-md border px-3 py-1.5 text-sm outline-none"
          style={{
            borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
            background: "var(--center-channel-bg)",
            color: "var(--center-channel-color)",
          }}
          aria-label={t("keyboardShortcuts.searchPlaceholder")}
        />

        <div className="max-h-80 space-y-4 overflow-y-auto">
          {filteredCategories.map((cat) => (
            <div key={cat.nameKey}>
              <h3
                className="mb-1 text-xs font-semibold tracking-wide uppercase"
                style={{ color: "var(--text-tertiary)" }}
              >
                {t(`keyboardShortcuts.${cat.nameKey}`)}
              </h3>
              <div className="space-y-1">
                {cat.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between">
                    <span className="text-sm text-[var(--center-channel-color)]">
                      {t(`keyboardShortcuts.${s.labelKey}`)}
                    </span>
                    <kbd
                      className="rounded-md border px-2 py-0.5 font-mono text-xs"
                      style={{
                        borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                        backgroundColor: "rgba(var(--center-channel-color-rgb), 0.08)",
                        color: "var(--center-channel-color)",
                      }}
                    >
                      {replaceModKeys(s.keys)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div aria-live="polite" aria-atomic="true">
            {search.trim() && filteredCategories.length > 0 && (
              <span className="sr-only" role="status">
                {filteredCategories.reduce((acc, c) => acc + c.shortcuts.length, 0)} shortcuts match
              </span>
            )}
            {filteredCategories.length === 0 && (
              <EmptyState
                description={t("keyboardShortcuts.noResults", { search })}
                className="!py-0"
              />
            )}
          </div>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="mt-4 w-full rounded-md py-2 text-sm"
          style={{
            backgroundColor: "var(--center-channel-color)",
            color: "var(--center-channel-bg)",
          }}
        >
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}
