"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  EMOJIS,
  EMOJI_CATEGORIES,
  SKIN_TONES,
  type EmojiEntry,
  type EmojiCat,
} from "@/lib/emoji/emoji-data";

const RECENT_KEY = "chat_recent_emojis";
const SKIN_KEY = "chat_emoji_skin";
const MAX_RECENT = 20;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    console.warn("Failed to load recent emojis");
    return [];
  }
}

function saveRecent(emojis: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(emojis.slice(0, MAX_RECENT)));
  } catch {
    console.warn("Failed to save recent emojis");
    /* ignore */
  }
}

function loadSkinTone(): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(SKIN_KEY) ?? "0", 10);
  } catch {
    console.warn("Failed to load skin tone");
    return 0;
  }
}

function saveSkinTone(idx: number) {
  try {
    localStorage.setItem(SKIN_KEY, String(idx));
  } catch {
    console.warn("Failed to save skin tone");
    /* ignore */
  }
}

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
}

export function EmojiPicker({ onSelect, onClose, anchorEl }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<EmojiCat | null>(null);
  const [skinTone, setSkinTone] = useState(loadSkinTone);
  const [preview, setPreview] = useState<EmojiEntry | null>(null);
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [activeIdx, setActiveIdx] = useState(-1);

  // Position picker relative to anchor
  useEffect(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const pickerH = 420;
    if (spaceBelow >= pickerH) {
      setPosition({ top: rect.bottom + 4, left: Math.max(4, rect.left) });
    } else {
      setPosition({ top: Math.max(4, rect.top - pickerH), left: Math.max(4, rect.left) });
    }
  }, [anchorEl]);

  // Click outside + Escape
  useEffect(() => {
    const el = pickerRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    requestAnimationFrame(() => searchRef.current?.focus());
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [onClose]);

  const emojiByName = useMemo(() => {
    const map = new Map<string, EmojiEntry>();
    for (const e of EMOJIS) map.set(e.n, e);
    return map;
  }, []);

  const filteredEmojis = useMemo(() => {
    if (search) {
      const q = search.toLowerCase();
      return EMOJIS.filter((e) => e.n.includes(q));
    }
    if (category) return EMOJIS.filter((e) => e.cat === category).slice(0, 500);
    return EMOJIS;
  }, [search, category]);

  const recentEmojis = useMemo(() => {
    return recent.map((c) => emojiByName.get(c)).filter(Boolean) as EmojiEntry[];
  }, [recent, emojiByName]);

  const handleSelect = useCallback(
    (emoji: EmojiEntry) => {
      const ch = skinTone > 0 && emoji.sk ? applySkinTone(emoji.c, emoji.sk, skinTone) : emoji.c;
      const updated = [emoji.n, ...recent.filter((r) => r !== emoji.n)];
      setRecent(updated);
      saveRecent(updated);
      onSelect(ch);
    },
    [skinTone, recent, onSelect],
  );

  const activeItems = useMemo(() => {
    return category ? filteredEmojis : filteredEmojis.slice(0, 300);
  }, [category, filteredEmojis]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = activeItems;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && activeIdx >= 0 && activeIdx < items.length) {
        e.preventDefault();
        if (items[activeIdx]) handleSelect(items[activeIdx]);
      }
    },
    [activeItems, activeIdx, handleSelect],
  );

  return (
    <div
      ref={pickerRef}
      role="dialog"
      aria-label="Emoji picker"
      className="fixed z-50 flex flex-col overflow-hidden rounded-xl border shadow-lg"
      style={{
        width: 340,
        maxHeight: 440,
        background: "var(--center-channel-bg)",
        borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
        boxShadow: "var(--elevation-5)",
        top: position.top,
        left: position.left,
      }}
    >
      {/* Search */}
      <div className="p-2">
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveIdx(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search emojis..."
          className="w-full rounded-md px-3 py-1.5 text-sm outline-none"
          style={{
            background: "rgba(var(--center-channel-color-rgb), 0.06)",
            color: "var(--center-channel-color)",
            border: "1px solid transparent",
          }}
        />
      </div>

      {/* Skin tone selector */}
      <div
        className="flex items-center gap-1 px-2 pb-1"
        style={{ borderBottom: "1px solid rgba(var(--center-channel-color-rgb), 0.08)" }}
      >
        <button
          onClick={() => {
            setSkinTone(0);
            saveSkinTone(0);
          }}
          className="flex h-6 w-6 items-center justify-center rounded text-sm"
          style={{
            background: skinTone === 0 ? "rgba(var(--button-bg-rgb), 0.12)" : "transparent",
            filter: "grayscale(1)",
            opacity: skinTone === 0 ? 1 : 0.5,
          }}
          title="Default"
        >
          👋
        </button>
        {SKIN_TONES.map((t, i) => (
          <button
            key={t}
            onClick={() => {
              setSkinTone(i + 1);
              saveSkinTone(i + 1);
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-sm"
            style={{
              background: skinTone === i + 1 ? "rgba(var(--button-bg-rgb), 0.12)" : "transparent",
            }}
            title={`Skin tone ${i + 1}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div
        className="flex gap-1 overflow-x-auto px-2 py-1"
        style={{ borderBottom: "1px solid rgba(var(--center-channel-color-rgb), 0.08)" }}
      >
        <button
          onClick={() => { setCategory(null); setSearch(""); setActiveIdx(-1); }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs transition-colors"
          style={{
            background: category === null ? "rgba(var(--button-bg-rgb), 0.12)" : "transparent",
          }}
          title="All"
          aria-label="All"
        >
          🗂️
        </button>
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setCategory(cat.id as EmojiCat);
              setSearch("");
              setActiveIdx(-1);
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs transition-colors"
            style={{
              background: category === cat.id ? "rgba(var(--button-bg-rgb), 0.12)" : "transparent",
            }}
            title={cat.label}
            aria-label={cat.label}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="flex-1 overflow-y-auto px-1 py-1" style={{ scrollBehavior: "smooth" }}>
        {!search && category === null && recentEmojis.length > 0 && (
          <div className="mb-1">
            <p
              className="px-2 text-xs font-medium"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
            >
              Recent
            </p>
            <div className="flex flex-wrap gap-0.5 px-1">
              {recentEmojis.map((e) => (
                <button
                  key={e.n}
                  onClick={() => handleSelect(e)}
                  onMouseEnter={() => setPreview(e)}
                  onMouseLeave={() => setPreview(null)}
                  className="flex h-8 w-8 items-center justify-center rounded text-lg transition-colors hover:bg-[rgba(var(--button-bg-rgb),0.08)]"
                >
                  {e.c}
                </button>
              ))}
            </div>
          </div>
        )}
        {search && filteredEmojis.length === 0 && (
          <p
            className="px-2 py-4 text-center text-sm"
            style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
          >
            No emojis found
          </p>
        )}
        {filteredEmojis.length > 0 && (
          <div className="flex flex-wrap gap-0.5 px-1">
            {activeItems.map((e, i) => (
              <button
                key={e.n}
                onClick={() => handleSelect(e)}
                onMouseEnter={() => {
                  setPreview(e);
                  setActiveIdx(i);
                }}
                onMouseLeave={() => setPreview(null)}
                className="flex h-8 w-8 items-center justify-center rounded text-lg transition-colors"
                style={{
                  background: activeIdx === i ? "rgba(var(--button-bg-rgb), 0.12)" : "transparent",
                }}
              >
                {e.c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 text-xs"
          style={{
            borderTop: "1px solid rgba(var(--center-channel-color-rgb), 0.08)",
            color: "rgba(var(--center-channel-color-rgb), 0.72)",
            minHeight: 36,
          }}
        >
          <span className="text-lg">{preview.c}</span>
          <span>:{preview.n}:</span>
          {EMOJI_CATEGORIES.find((c) => c.id === preview.cat) && (
            <span className="ml-auto opacity-50">
              {EMOJI_CATEGORIES.find((c) => c.id === preview.cat)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function applySkinTone(emoji: string, sk: string, toneIdx: number): string {
  const toneCodes = sk.split(",");
  if (toneIdx <= 0 || toneIdx > toneCodes.length) return emoji;
  const tc = toneCodes[toneIdx - 1];
  if (!tc) return emoji;
  const toneCode = parseInt(tc, 16);
  const baseCode = emoji.codePointAt(0);
  if (!baseCode) return emoji;
  return String.fromCodePoint(baseCode, toneCode);
}

// Colon autocomplete helpers
export function findEmojiShortcut(
  text: string,
  cursorPos: number,
): { start: number; end: number; query: string } | null {
  const before = text.slice(0, cursorPos);
  const colonIdx = before.lastIndexOf(":");
  if (colonIdx === -1 || colonIdx === cursorPos - 1) return null;
  // Check there's no space between colon and cursor
  const query = before.slice(colonIdx + 1);
  if (!query || query.includes(" ") || query.includes(":")) return null;
  return { start: colonIdx, end: cursorPos, query: query.toLowerCase() };
}

export function searchEmojis(query: string): EmojiEntry[] {
  const q = query.toLowerCase();
  return EMOJIS.filter((e) => e.n.includes(q)).slice(0, 10);
}

export function getEmojiByName(name: string): string | null {
  const entry = EMOJIS.find((e) => e.n === name);
  return entry?.c ?? null;
}
