"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Skeleton } from "@chat/ui";

const SEARCH_DEBOUNCE_MS = 300;

interface SearchResult {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  rank: number;
}

interface Props {
  workspaceId: string;
  workspaceSlug: string;
}

export function SearchBar({ workspaceId, workspaceSlug }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(SearchResult & { channel_slug?: string })[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    // Only auto-focus on desktop to avoid pulling up keyboard on mobile
    if (inputRef.current && window.innerWidth >= 768) {
      inputRef.current.focus();
    }
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setSelectedIndex(-1);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get<{ messages: SearchResult[] }>(
          `/messages/search?q=${encodeURIComponent(q)}&workspace_id=${workspaceId}`,
        );
        const channels = await api.get<{ channels: { id: string; slug: string }[] }>(
          `/workspaces/${workspaceId}/channels`,
        );
        const slugMap = new Map(channels.channels.map((c) => [c.id, c.slug]));
        setResults(res.messages.map((m) => ({ ...m, channel_slug: slugMap.get(m.channel_id) })));
        setSelectedIndex(-1);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [workspaceId],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const result = results[selectedIndex];
        if (result?.channel_slug) {
          window.location.href = `/${workspaceSlug}/${result.channel_slug}`;
        }
      } else if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    },
    [results, selectedIndex, workspaceSlug],
  );

  const handleFocus = useCallback(() => {
    if (results.length > 0) setOpen(true);
  }, [results.length]);

  const handleBlur = useCallback(() => {
    setTimeout(() => setOpen(false), 200);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => search(e.target.value), SEARCH_DEBOUNCE_MS);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Search messages..."
        aria-label="Search messages"
        aria-autocomplete="list"
        aria-controls="search-results"
        aria-expanded={open && results.length > 0}
        className="w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-1.5 text-sm text-[var(--color-input-fg)] placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-input-border-focus)] focus:ring-2 focus:ring-[var(--color-input-focus-ring)] focus:outline-none"
      />
      {open && results.length > 0 && (
        <div
          id="search-results"
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] shadow-[var(--shadow-xl)]"
          role="listbox"
        >
          {results.map((r, index) => (
            <Link
              key={r.id}
              href={`/${workspaceSlug}/${r.channel_slug ?? r.channel_id}`}
              className={`block border-b border-[var(--color-border-primary)] px-4 py-2 transition-colors ${
                index === selectedIndex
                  ? "bg-[var(--color-background-tertiary)]"
                  : "hover:bg-[var(--color-background-tertiary)]"
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <p className="text-sm break-words">{r.content.slice(0, 120)}</p>
              <p className="mt-0.5 text-xs text-[var(--color-foreground-tertiary)]">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
      {loading && (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] p-2 shadow-[var(--shadow-xl)]">
          <div className="space-y-1">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-12 w-4/5" />
          </div>
        </div>
      )}
      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] p-4 shadow-[var(--shadow-xl)]">
          <p className="text-center text-sm text-[var(--color-foreground-tertiary)]">
            No results for "{query}"
          </p>
        </div>
      )}
    </div>
  );
}
