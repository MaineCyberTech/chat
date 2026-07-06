"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Search as SearchIcon, Filter, X, Calendar, Hash, ChevronDown } from "lucide-react";

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

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded-sm px-0.5" style={{ background: "rgba(var(--button-bg-rgb), 0.2)", color: "var(--center-channel-color)" }}>
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default function SearchPage() {
  const params = useParams<{ workspaceSlug: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(SearchResult & { channel_name?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const channelsRef = useRef<ChannelInfo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const wsRes = await api.get<{ workspaces: { id: string; name: string; slug: string }[] }>("/workspaces");
        const ws = wsRes.workspaces.find((w) => w.slug === params.workspaceSlug);
        if (!ws) return;
        setWorkspaceId(ws.id);
        const chRes = await api.get<{ channels: ChannelInfo[] }>(`/workspaces/${ws.id}/channels`);
        setChannels(chRes.channels);
        channelsRef.current = chRes.channels;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, [params.workspaceSlug]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = useCallback(
    async (q: string, append = false) => {
      if (q.length < 2 || !workspaceId) {
        setResults([]);
        return;
      }
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        let url = `/messages/search?q=${encodeURIComponent(q)}&workspace_id=${workspaceId}&offset=${append ? currentOffset : 0}`;
        if (dateFrom) url += `&date_from=${encodeURIComponent(dateFrom)}`;
        if (dateTo) url += `&date_to=${encodeURIComponent(dateTo)}`;
        const res = await api.get<SearchResponse>(url);
        const channelMap = new Map(channelsRef.current.map((c) => [c.id, c.name]));
        const mapped = res.messages.map((m) => ({ ...m, channel_name: channelMap.get(m.channel_id) }));
        if (append) setResults((prev) => [...prev, ...mapped]);
        else setResults(mapped);
        setHasMore(res.hasMore);
        setCurrentOffset(append ? currentOffset + res.messages.length : res.messages.length);
      } catch {
        if (!append) setResults([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [workspaceId, dateFrom, dateTo, currentOffset],
  );

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--center-channel-bg)" }}>
      <div className="mm-channel-header">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="mm-button-icon" aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <h1 className="mm-font-heading text-base font-semibold">Search</h1>
        </div>
      </div>

      <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.08)" }}>
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-2xl">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => search(e.target.value), 300);
              }}
              onKeyDown={(e) => { if (e.key === "Escape") { router.back(); } }}
              placeholder="Search messages..."
              aria-label="Search messages"
              className="w-full rounded-lg px-9 py-2 text-sm outline-none"
              style={{ border: "solid 1px rgba(var(--center-channel-color-rgb), 0.16)", background: "rgba(var(--center-channel-color-rgb), 0.04)", color: "var(--center-channel-color)" }}
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 mm-button-icon" aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`shrink-0 rounded-lg px-3 text-xs font-medium transition-colors ${showFilters ? "text-white" : ""}`}
            style={{ background: showFilters ? "var(--button-bg)" : "rgba(var(--center-channel-color-rgb), 0.08)", color: showFilters ? "#fff" : "rgba(var(--center-channel-color-rgb), 0.72)" }}
            aria-label="Toggle filters"
          >
            <Filter size={16} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }} />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded px-2 py-1 text-xs" style={{ border: "solid 1px rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)", color: "var(--center-channel-color)" }} aria-label="From date" />
              <span className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }}>to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded px-2 py-1 text-xs" style={{ border: "solid 1px rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)", color: "var(--center-channel-color)" }} aria-label="To date" />
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mb-3 text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>{error}</p>
          <button
            onClick={() => { setError(null); window.location.reload(); }}
            className="rounded-md px-4 py-2 text-xs font-medium text-white"
            style={{ background: "var(--button-bg)" }}
          >
            Retry
          </button>
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse space-y-2 rounded-lg p-3" style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}>
                <div className="h-3 w-24 rounded" style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)" }} />
                <div className="h-4 w-3/4 rounded" style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }} />
                <div className="h-3 w-16 rounded" style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }} />
              </div>
            ))}
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full mb-3" style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }}>
              <SearchIcon size={20} style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>No results found</p>
            <p className="mt-1 text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>Try a different search term</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="p-4 space-y-2">
            {results.map((r) => {
              const channel = channels.find((c) => c.id === r.channel_id);
              return (
                <Link
                  key={r.id}
                  href={`/${params.workspaceSlug}/${channel?.slug ?? r.channel_id}`}
                  className="group block rounded-lg p-3 transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.04)]"
                >
                  <div className="flex items-center gap-2 text-xs mb-1" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
                    {channel && <><Hash size={12} /><span>{channel.name}</span><span>&middot;</span></>}
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--center-channel-color)" }}>
                    {highlightText(r.content.slice(0, 500), query)}
                  </p>
                </Link>
              );
            })}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => search(query, true)}
                  disabled={loadingMore}
                  className="flex items-center gap-1 rounded-lg px-4 py-2 text-xs font-medium transition-colors hover:bg-[rgba(var(--button-bg-rgb),0.08)]"
                  style={{ color: "var(--button-bg)" }}
                >
                  {loadingMore ? "Loading..." : "Show more results"}
                  <ChevronDown size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && query.length < 2 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full mb-4" style={{ background: "rgba(var(--button-bg-rgb), 0.08)" }}>
              <SearchIcon size={24} style={{ color: "var(--button-bg)" }} />
            </div>
            <p className="text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>Type at least 2 characters to search</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
