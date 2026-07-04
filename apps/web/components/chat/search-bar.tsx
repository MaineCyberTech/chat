"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Skeleton } from "@chat/ui";
import { Settings, ChevronDown } from "lucide-react";

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded-sm bg-yellow-200 px-0.5 dark:bg-yellow-800">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

const SEARCH_DEBOUNCE_MS = 300;
const CHANNELS_CACHE_TTL = 5 * 60 * 1000;
interface SearchResult {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  rank: number;
}

interface SearchResponse {
  messages: SearchResult[];
  hasMore: boolean;
  offset: number;
}

interface ChannelInfo {
  id: string;
  slug: string;
}

interface Props {
  workspaceId: string;
  workspaceSlug: string;
}

// Module-level cache for channels (persists across component instances)
let channelsCache: { data: ChannelInfo[]; timestamp: number } | null = null;

async function getChannelsWithCache(workspaceId: string): Promise<ChannelInfo[]> {
  const now = Date.now();
  if (channelsCache && now - channelsCache.timestamp < CHANNELS_CACHE_TTL) {
    return channelsCache.data;
  }
  const res = await api.get<{ channels: ChannelInfo[] }>(`/workspaces/${workspaceId}/channels`);
  channelsCache = { data: res.channels, timestamp: now };
  return res.channels;
}

export function SearchBar({ workspaceId, workspaceSlug }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(SearchResult & { channel_slug?: string })[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    if (inputRef.current && window.innerWidth >= 768) {
      inputRef.current.focus();
    }
  }, []);

  // Listen for chat:search-open custom event (from keyboard shortcut)
  useEffect(() => {
    function handleSearchOpen() {
      setOpen(true);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    document.addEventListener("chat:search-open", handleSearchOpen);
    return () => document.removeEventListener("chat:search-open", handleSearchOpen);
  }, []);

  function buildSearchUrl(q: string, offset = 0): string {
    let url = `/messages/search?q=${encodeURIComponent(q)}&workspace_id=${workspaceId}&offset=${offset}`;
    if (dateFrom) url += `&date_from=${encodeURIComponent(dateFrom)}`;
    if (dateTo) url += `&date_to=${encodeURIComponent(dateTo)}`;
    if (authorFilter) url += `&author_id=${encodeURIComponent(authorFilter)}`;
    return url;
  }

  const search = useCallback(
    async (q: string, append = false) => {
      if (q.length < 2) {
        setResults([]);
        setSelectedIndex(-1);
        return;
      }
      const offset = append ? currentOffset : 0;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      try {
        const res = await api.get<SearchResponse>(buildSearchUrl(q, offset));
        const channels = await getChannelsWithCache(workspaceId);
        const slugMap = new Map(channels.map((c) => [c.id, c.slug]));
        const mapped = res.messages.map((m) => ({ ...m, channel_slug: slugMap.get(m.channel_id) }));
        if (append) {
          setResults((prev) => [...prev, ...mapped]);
        } else {
          setResults(mapped);
        }
        setHasMore(res.hasMore);
        setCurrentOffset(offset + res.messages.length);
        setSelectedIndex(-1);
        setOpen(true);
      } catch {
        if (!append) setResults([]);
        console.warn("Search failed");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [workspaceId, dateFrom, dateTo, authorFilter, currentOffset],
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
          router.push(`/${workspaceSlug}/${result.channel_slug}`);
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
    setTimeout(() => setOpen(false), 300);
  }, []);

  return (
    <div className="relative">
      <div className="flex gap-1">
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
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`shrink-0 rounded-lg px-2 text-xs font-medium transition-colors ${
            showFilters
              ? "bg-[var(--color-brand-primary)] text-white"
              : "bg-[var(--color-background-tertiary)] text-[var(--color-foreground-secondary)]"
          }`}
          aria-label="Toggle search filters"
          aria-pressed={showFilters}
          title="Search filters"
        >
          <Settings size={16} />
        </button>
      </div>
      {showFilters && (
        <div className="mt-1 flex flex-wrap gap-2">
          <div className="min-w-[120px] flex-1">
            <label className="mb-0.5 block text-xs text-[var(--color-foreground-tertiary)]">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1 text-xs text-[var(--color-input-fg)]"
            />
          </div>
          <div className="min-w-[120px] flex-1">
            <label className="mb-0.5 block text-xs text-[var(--color-foreground-tertiary)]">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1 text-xs text-[var(--color-input-fg)]"
            />
          </div>
          <div className="min-w-[120px] flex-1">
            <label className="mb-0.5 block text-xs text-[var(--color-foreground-tertiary)]">
              Author ID
            </label>
            <input
              type="text"
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              placeholder="User ID (UUID)"
              className="w-full rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1 text-xs text-[var(--color-input-fg)] placeholder:text-[var(--color-input-placeholder)]"
            />
          </div>
        </div>
      )}
      {open && results.length > 0 && (
        <div
          id="search-results"
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] shadow-[var(--shadow-xl)]"
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
              <p className="text-sm break-words">{highlightText(r.content.slice(0, 200), query)}</p>
              <p className="mt-0.5 text-xs text-[var(--color-foreground-tertiary)]">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
          {hasMore && (
            <button
              onClick={() => search(query, true)}
              disabled={loadingMore}
              className="flex w-full items-center justify-center gap-1 px-4 py-2 text-xs font-medium text-[var(--color-foreground-secondary)] hover:bg-[var(--color-background-tertiary)] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Load more search results"
            >
              <ChevronDown size={14} />
              {loadingMore ? "Loading..." : "Show more"}
            </button>
          )}
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
            No results for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
