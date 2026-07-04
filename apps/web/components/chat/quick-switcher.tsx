"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Hash, Search, X } from "lucide-react";
import type { Channel } from "@chat/db";

interface Props {
  workspaceSlug: string;
  open: boolean;
  onClose: () => void;
}

export function QuickSwitcher({ workspaceSlug, open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filtered, setFiltered] = useState<Channel[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIndex(0);
    api
      .get<{ workspaces: { id: string; name: string; slug: string }[] }>("/workspaces")
      .then((res) => {
        const ws = res.workspaces.find((w) => w.slug === workspaceSlug);
        if (!ws) return;
        api
          .get<{ channels: Channel[] }>(`/workspaces/${ws.id}/channels`)
          .then((res) => setChannels(res.channels))
          .catch(() => {});
      })
      .catch(() => {});
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, workspaceSlug]);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(channels.slice(0, 10));
      return;
    }
    const q = query.toLowerCase();
    const results = channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.topic && c.topic.toLowerCase().includes(q)),
    );
    setFiltered(results.slice(0, 20));
    setSelectedIndex(0);
  }, [query, channels]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        router.push(`/${workspaceSlug}/${filtered[selectedIndex].slug}`);
        onClose();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [filtered, selectedIndex, workspaceSlug, router, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-[var(--color-dialog-overlay)]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] shadow-[var(--shadow-xl)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Quick channel switcher"
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-border-primary)] px-3 py-2">
          <Search size={16} className="shrink-0 text-[var(--color-foreground-tertiary)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search channels..."
            className="flex-1 bg-transparent text-sm text-[var(--color-foreground-primary)] placeholder:text-[var(--color-foreground-tertiary)] focus:outline-none"
            aria-label="Search channels"
          />
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)]"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-[var(--color-foreground-tertiary)]">
              {query ? "No channels found" : "No channels available"}
            </p>
          )}
          {filtered.map((ch, i) => (
            <button
              key={ch.id}
              onClick={() => {
                router.push(`/${workspaceSlug}/${ch.slug}`);
                onClose();
              }}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                i === selectedIndex
                  ? "bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]"
                  : "text-[var(--color-foreground-primary)] hover:bg-[var(--color-background-tertiary)]"
              }`}
            >
              <Hash size={14} className="shrink-0 text-[var(--color-foreground-tertiary)]" />
              <span className="min-w-0 truncate font-medium">{ch.name}</span>
              {ch.topic && (
                <span className="ml-auto truncate text-xs text-[var(--color-foreground-tertiary)]">
                  {ch.topic}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
