"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Skeleton } from "@chat/ui";
import { Settings, ChevronDown, FileText, MessageSquare } from "lucide-react";

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
  name: string;
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
  const [autocompleteUsers, setAutocompleteUsers] = useState<
    { id: string; display_name: string }[]
  >([]);
  const [autocompleteChannels, setAutocompleteChannels] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchType, setSearchType] = useState<"messages" | "files">("messages");
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showOperatorHint, setShowOperatorHint] = useState(false);
  const [showFileExtSuggest, setShowFileExtSuggest] = useState(false);
  const [hasQuery, setHasQuery] = useState("");
  const [operatorHintPinned, setOperatorHintPinned] = useState(false);
  const [dotExtQuery, setDotExtQuery] = useState("");
  const [showDotExtSuggest, setShowDotExtSuggest] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autocompleteRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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
    let url = `/messages/search?q=${encodeURIComponent(q)}&workspace_id=${workspaceId}&type=${searchType}&offset=${offset}`;
    if (dateFrom) url += `&date_from=${encodeURIComponent(dateFrom)}`;
    if (dateTo) url += `&date_to=${encodeURIComponent(dateTo)}`;
    if (authorFilter) url += `&author_id=${encodeURIComponent(authorFilter)}`;
    return url;
  }

  const search = useCallback(
    async (q: string, append = false) => {
      if (q.length < 2) {
        setResults([]);
        setAutocompleteUsers([]);
        setAutocompleteChannels([]);
        setShowAutocomplete(false);
        setSelectedIndex(-1);
        return;
      }

      // Fetch autocomplete suggestions for users and channels
      clearTimeout(autocompleteRef.current);
      autocompleteRef.current = setTimeout(async () => {
        try {
          const [userRes, channelData] = await Promise.all([
            api
              .get<{
                profiles: { id: string; display_name: string }[];
              }>(`/auth/search?q=${encodeURIComponent(q)}`)
              .catch(() => ({ profiles: [] })),
            getChannelsWithCache(workspaceId),
          ]);
          setAutocompleteUsers(userRes.profiles.slice(0, 5));
          setAutocompleteChannels(
            channelData
              .filter((c) => c.slug.includes(q.toLowerCase()) || c.id.includes(q))
              .slice(0, 5),
          );
          setShowAutocomplete(true);
        } catch (err) {
          console.warn("Autocomplete fetch failed", String(err));
        }
      }, 150);

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
        <div className="relative flex-1">
          <div className="flex">
            <button
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="flex shrink-0 items-center gap-1 rounded-l-lg px-2 py-1.5 text-xs font-medium"
              style={{
                background: "rgba(var(--center-channel-color-rgb), 0.08)",
                color: "rgba(var(--center-channel-color-rgb), 0.72)",
                borderRight: "1px solid rgba(var(--center-channel-color-rgb), 0.16)",
              }}
              aria-label="Search type"
            >
              {searchType === "messages" ? <MessageSquare size={12} /> : <FileText size={12} />}
              {searchType === "messages" ? "Messages" : "Files"}
              <ChevronDown size={10} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                const v = e.target.value;

                // Operator hints: auto-show when no operator is being typed
                if (!operatorHintPinned) {
                  const opMatch = v.match(/\b(from|in|channel|has|on):\s*\w*$/i);
                  setShowOperatorHint(v.length >= 2 && !v.includes(":"));
                }

                // has: suggestions
                const hasMatch = v.match(/\bhas:\s*(\w*)$/i);
                setShowFileExtSuggest(!!hasMatch);
                setHasQuery(hasMatch?.[1]?.toLowerCase() ?? "");

                // File extension suggestions when typing .xxx
                const dotMatch = v.match(/(^|\s)(\.([a-z]*))$/i);
                const dotExtVal = dotMatch?.[3];
                setShowDotExtSuggest(dotExtVal ? dotExtVal.length > 0 : false);
                setDotExtQuery(dotExtVal?.toLowerCase() ?? "");

                clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => search(v), SEARCH_DEBOUNCE_MS);
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={`Search ${searchType}...`}
              aria-label={`Search ${searchType}`}
              aria-autocomplete="list"
              aria-controls="search-results"
              aria-expanded={open && results.length > 0}
              className="w-full px-3 py-1.5 text-sm placeholder:text-[rgba(var(--center-channel-color-rgb),0.56)] focus:outline-none"
              style={{
                border: "1px solid rgba(var(--center-channel-color-rgb), 0.16)",
                borderLeft: "none",
                borderRight: "none",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
            />
            <button
              onClick={() => {
                setOperatorHintPinned((p) => !p);
                setShowOperatorHint((s) => !s);
              }}
              className="flex shrink-0 items-center px-2 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: showOperatorHint
                  ? "var(--button-bg)"
                  : "rgba(var(--center-channel-color-rgb), 0.08)",
                color: showOperatorHint ? "#fff" : "rgba(var(--center-channel-color-rgb), 0.72)",
                borderTop: "1px solid rgba(var(--center-channel-color-rgb), 0.16)",
                borderBottom: "1px solid rgba(var(--center-channel-color-rgb), 0.16)",
              }}
              aria-label="Search operator hints"
              aria-pressed={showOperatorHint}
              title="Search operators"
            >
              <span className="text-sm font-bold leading-none">?</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex shrink-0 items-center rounded-r-lg px-2 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: showFilters
                  ? "var(--button-bg)"
                  : "rgba(var(--center-channel-color-rgb), 0.08)",
                color: showFilters ? "#fff" : "rgba(var(--center-channel-color-rgb), 0.72)",
              }}
              aria-label="Toggle search filters"
              aria-pressed={showFilters}
              title="Search filters"
            >
              <Settings size={16} />
            </button>
          </div>

          {/* Search type dropdown */}
          {showTypeMenu && (
            <div
              className="absolute top-full left-0 z-50 mt-1 w-36 rounded-lg border py-1 shadow-[var(--elevation-4)]"
              style={{
                background: "var(--center-channel-bg)",
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
              }}
            >
              <button
                onClick={() => {
                  setSearchType("messages");
                  setShowTypeMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                style={{
                  color: "var(--center-channel-color)",
                  fontWeight: searchType === "messages" ? 600 : 400,
                }}
              >
                <MessageSquare size={14} />
                Messages
              </button>
              <button
                onClick={() => {
                  setSearchType("files");
                  setShowTypeMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                style={{
                  color: "var(--center-channel-color)",
                  fontWeight: searchType === "files" ? 600 : 400,
                }}
              >
                <FileText size={14} />
                Files
              </button>
            </div>
          )}

          {/* File extension suggestions for has: operator */}
          {showFileExtSuggest && (
            <div
              className="absolute left-0 z-50 mt-1 w-auto rounded-lg border px-3 py-2 shadow-[var(--elevation-3)]"
              style={{
                background: "var(--center-channel-bg)",
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                top: "100%",
              }}
            >
              <p
                className="mb-1 text-xs font-medium"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                File type suggestions
              </p>
              <div className="space-y-0.5">
                {[
                  { ext: "has:image", desc: "Images" },
                  { ext: "has:video", desc: "Videos" },
                  { ext: "has:audio", desc: "Audio files" },
                  { ext: "has:file", desc: "Documents" },
                  { ext: "has:link", desc: "Links" },
                  { ext: "has:code", desc: "Code snippets" },
                  { ext: "has:pdf", desc: "PDF documents" },
                  { ext: "has:spreadsheet", desc: "Spreadsheets" },
                ]
                  .filter((s) => !hasQuery || s.ext.replace("has:", "").startsWith(hasQuery))
                  .slice(0, 6)
                  .map(({ ext, desc }) => (
                    <button
                      key={ext}
                      onClick={() => {
                        const before = query.replace(/\bhas:\s*\w*$/i, "");
                        setQuery(before + ext + " ");
                        setShowFileExtSuggest(false);
                        inputRef.current?.focus();
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                      style={{ color: "var(--center-channel-color)" }}
                    >
                      <code
                        className="rounded px-1 py-0.5 text-xs font-medium"
                        style={{
                          background: "rgba(var(--button-bg-rgb), 0.12)",
                          color: "var(--button-bg)",
                        }}
                      >
                        {ext}
                      </code>
                      <span style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
                        {desc}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
          {/* File extension suggestions when typing .ext */}
          {showDotExtSuggest && (
            <div
              className="absolute left-0 z-50 mt-1 w-auto rounded-lg border px-3 py-2 shadow-[var(--elevation-3)]"
              style={{
                background: "var(--center-channel-bg)",
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                top: "100%",
              }}
            >
              <p
                className="mb-1 text-xs font-medium"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                File extension suggestions
              </p>
              <div className="space-y-1">
                {[
                  {
                    category: "Documents",
                    exts: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv"],
                  },
                  {
                    category: "Images",
                    exts: [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp"],
                  },
                  {
                    category: "Code",
                    exts: [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".sql", ".json", ".yaml", ".xml"],
                  },
                  {
                    category: "Media",
                    exts: [".mp4", ".mp3", ".wav", ".ogg", ".mov", ".avi"],
                  },
                ]
                  .map((grp) => ({
                    ...grp,
                    exts: grp.exts.filter((e) => e.replace(".", "").startsWith(dotExtQuery)),
                  }))
                  .filter((grp) => grp.exts.length > 0)
                  .slice(0, 4)
                  .map((grp) => (
                    <div key={grp.category}>
                      <p
                        className="mb-0.5 px-2 text-[10px] font-medium uppercase tracking-wider"
                        style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }}
                      >
                        {grp.category}
                      </p>
                      <div className="flex flex-wrap gap-1 px-2 pb-1">
                        {grp.exts.map((ext) => (
                          <button
                            key={ext}
                            onClick={() => {
                              const before = query.replace(/(^|\s)\.[a-z]*$/i, "$1");
                              setQuery(before + ext + " ");
                              setShowDotExtSuggest(false);
                              inputRef.current?.focus();
                            }}
                            className="rounded px-1.5 py-0.5 text-xs font-medium hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                            style={{
                              background: "rgba(var(--button-bg-rgb), 0.1)",
                              color: "var(--button-bg)",
                            }}
                          >
                            {ext}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {showOperatorHint && (
            <div
              className="absolute left-0 z-50 mt-1 w-auto rounded-lg border px-3 py-2 shadow-[var(--elevation-3)]"
              style={{
                background: "var(--center-channel-bg)",
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                top: "100%",
              }}
            >
              <p
                className="mb-1 text-xs font-medium"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                Search operators
              </p>
              <div className="space-y-0.5">
                {[
                  { op: "from:", desc: "Search by author" },
                  { op: "in:", desc: "Search in a channel" },
                  { op: "channel:", desc: "Search in a channel" },
                  { op: "on:2025-01-15", desc: "Search by date" },
                  { op: "has:", desc: "Filter by has:link, has:image, has:file" },
                ].map(({ op, desc }) => (
                  <button
                    key={op}
                    onClick={() => {
                      setQuery((prev) => prev + op);
                      inputRef.current?.focus();
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                    style={{ color: "var(--center-channel-color)" }}
                  >
                    <code
                      className="rounded px-1 py-0.5 text-xs font-medium"
                      style={{
                        background: "rgba(var(--button-bg-rgb), 0.12)",
                        color: "var(--button-bg)",
                      }}
                    >
                      {op}
                    </code>
                    <span style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
                      {desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {showFilters && (
        <div className="mt-1 flex flex-wrap gap-2">
          <div className="min-w-[120px] flex-1">
            <label
              className="mb-0.5 block text-xs"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
            >
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded px-2 py-1 text-xs"
              style={{
                border: "1px solid rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
            />
          </div>
          <div className="min-w-[120px] flex-1">
            <label
              className="mb-0.5 block text-xs"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
            >
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded px-2 py-1 text-xs"
              style={{
                border: "1px solid rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
            />
          </div>
          <div className="min-w-[120px] flex-1">
            <label
              className="mb-0.5 block text-xs"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
            >
              Author ID
            </label>
            <input
              type="text"
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              placeholder="User ID (UUID)"
              className="w-full rounded px-2 py-1 text-xs placeholder:text-[rgba(var(--center-channel-color-rgb),0.56)]"
              style={{
                border: "1px solid rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
            />
          </div>
        </div>
      )}
      {/* Autocomplete dropdown for users/channels */}
      {showAutocomplete && query.length >= 2 && !open && (
        <div
          className="absolute top-full right-0 left-0 z-50 mt-1 rounded-lg border p-2 shadow-[var(--elevation-4)]"
          style={{
            background: "var(--center-channel-bg)",
            borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
          }}
        >
          {autocompleteUsers.length > 0 && (
            <div className="mb-1">
              <p
                className="mb-0.5 px-2 text-xs font-medium"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                Users
              </p>
              {autocompleteUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setAuthorFilter(u.id);
                    setShowAutocomplete(false);
                  }}
                  className="w-full rounded-md px-2 py-1 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                  style={{ color: "var(--center-channel-color)" }}
                >
                  {u.display_name ?? u.id.slice(0, 8)}
                </button>
              ))}
            </div>
          )}
          {autocompleteChannels.length > 0 && (
            <div>
              <p
                className="mb-0.5 px-2 text-xs font-medium"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                Channels
              </p>
              {autocompleteChannels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setQuery(`#${ch.name}`);
                    setShowAutocomplete(false);
                  }}
                  className="w-full rounded-md px-2 py-1 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                  style={{ color: "var(--center-channel-color)" }}
                >
                  # {ch.name}
                </button>
              ))}
            </div>
          )}
          {autocompleteUsers.length === 0 && autocompleteChannels.length === 0 && (
            <p
              className="px-2 text-sm"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
            >
              No suggestions
            </p>
          )}
        </div>
      )}

      {open && results.length > 0 && (
        <div
          id="search-results"
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border shadow-[var(--elevation-4)]"
          style={{
            background: "var(--center-channel-bg)",
            borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
          }}
          role="listbox"
        >
          {/* Search type tabs */}
          <div
            className="flex border-b px-2"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.12)" }}
          >
            <button
              onClick={() => {
                setSearchType("messages");
                setResults([]);
                setOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors"
              style={{
                color:
                  searchType === "messages"
                    ? "var(--button-bg)"
                    : "rgba(var(--center-channel-color-rgb), 0.56)",
                borderBottom:
                  searchType === "messages" ? "2px solid var(--button-bg)" : "2px solid transparent",
              }}
              aria-pressed={searchType === "messages"}
            >
              <MessageSquare size={12} />
              Messages
            </button>
            <button
              onClick={() => {
                setSearchType("files");
                setResults([]);
                setOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors"
              style={{
                color:
                  searchType === "files"
                    ? "var(--button-bg)"
                    : "rgba(var(--center-channel-color-rgb), 0.56)",
                borderBottom:
                  searchType === "files" ? "2px solid var(--button-bg)" : "2px solid transparent",
              }}
              aria-pressed={searchType === "files"}
            >
              <FileText size={12} />
              Files
            </button>
          </div>
          {results.map((r, index) => (
            <Link
              key={r.id}
              href={`/${workspaceSlug}/${r.channel_slug ?? r.channel_id}`}
              className="block border-b px-4 py-2 transition-colors"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.08)",
                ...(index !== selectedIndex
                  ? {}
                  : { background: "rgba(var(--center-channel-color-rgb), 0.08)" }),
              }}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <p className="text-sm break-words">{highlightText(r.content.slice(0, 200), query)}</p>
              <p
                className="mt-0.5 text-xs"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
          {hasMore && (
            <button
              onClick={() => search(query, true)}
              disabled={loadingMore}
              className="flex w-full items-center justify-center gap-1 px-4 py-2 text-xs font-medium hover:bg-[rgba(var(--center-channel-color-rgb),0.08)] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
              aria-label="Load more search results"
            >
              <ChevronDown size={14} />
              {loadingMore ? "Loading..." : "Show more"}
            </button>
          )}
        </div>
      )}
      {loading && (
        <div
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border p-2 shadow-[var(--elevation-4)]"
          style={{
            background: "var(--center-channel-bg)",
            borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
          }}
        >
          <div className="space-y-1">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-12 w-4/5" />
          </div>
        </div>
      )}
      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border p-4 shadow-[var(--elevation-4)]"
          style={{
            background: "var(--center-channel-bg)",
            borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
          }}
        >
          <p
            className="text-center text-sm"
            style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
          >
            No results for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
