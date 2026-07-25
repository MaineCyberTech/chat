"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { t, tn } from "@/lib/i18n";
import {
  ArrowLeft,
  Search as SearchIcon,
  Filter,
  X,
  Calendar,
  Hash,
  ChevronDown,
} from "lucide-react";
import { EmptyState, HighlightText } from "@chat/ui";

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

export default function SearchPage() {
  const params = useParams<{ workspaceSlug: string }>();
  const router = useRouter();

  useEffect(() => {
    document.title = `${t("common.search")} - Chat`;
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"messages" | "files">("messages");
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
        const wsRes = await api.get<{ workspaces: { id: string; name: string; slug: string }[] }>(
          "/workspaces",
        );
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
        let url = `/messages/search?q=${encodeURIComponent(q)}&workspace_id=${workspaceId}&offset=${append ? currentOffset : 0}&type=${searchType}`;
        if (dateFrom) url += `&date_from=${encodeURIComponent(dateFrom)}`;
        if (dateTo) url += `&date_to=${encodeURIComponent(dateTo)}`;
        const res = await api.get<SearchResponse>(url);
        const channelMap = new Map(channelsRef.current.map((c) => [c.id, c.name]));
        const mapped = res.messages.map((m) => ({
          ...m,
          channel_name: channelMap.get(m.channel_id),
        }));
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
          <h1 className="mm-font-heading text-base font-semibold">{t("common.search")}</h1>
        </div>
      </div>

      <div
        className="border-b px-4 py-3"
        style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.08)" }}
      >
        <div className="flex gap-2">
          <div className="relative max-w-2xl flex-1">
            <SearchIcon
              size={16}
              className="absolute top-1/2 left-3 -translate-y-1/2"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => search(e.target.value), 300);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  router.back();
                }
              }}
              placeholder={t("search.placeholder", { type: t("search.messages") })}
              aria-label={t("search.placeholder", { type: t("search.messages") })}
              className="w-full rounded-lg px-9 py-2 text-sm outline-none"
              style={{
                border: "solid 1px rgba(var(--center-channel-color-rgb), 0.16)",
                background: "rgba(var(--center-channel-color-rgb), 0.04)",
                color: "var(--center-channel-color)",
              }}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  inputRef.current?.focus();
                }}
                className="mm-button-icon absolute top-1/2 right-3 -translate-y-1/2"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`shrink-0 rounded-lg px-3 text-xs font-medium transition-colors ${showFilters ? "" : ""}`}
            style={{
              background: showFilters
                ? "var(--button-bg)"
                : "rgba(var(--center-channel-color-rgb), 0.08)",
              color: showFilters ? "var(--button-color)" : "var(--text-secondary)",
            }}
            aria-label="Toggle filters"
          >
            <Filter size={16} />
          </button>
        </div>

        <div
          className="mt-3 flex gap-1 rounded-lg p-0.5"
          style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }}
        >
          <button
            onClick={() => {
              setSearchType("messages");
              setResults([]);
              if (query.length >= 2) search(query);
            }}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${searchType === "messages" ? "shadow-sm" : ""}`}
            style={{
              background: searchType === "messages" ? "var(--center-channel-bg)" : "transparent",
              color: "var(--center-channel-color)",
            }}
          >
            {t("search.messages")}
          </button>
          <button
            onClick={() => {
              setSearchType("files");
              setResults([]);
              if (query.length >= 2) search(query);
            }}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${searchType === "files" ? "shadow-sm" : ""}`}
            style={{
              background: searchType === "files" ? "var(--center-channel-bg)" : "transparent",
              color: "var(--center-channel-color)",
            }}
          >
            {t("search.files")}
          </button>
        </div>

        {showFilters && (
          <>
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5">
                <Calendar
                  size={14}
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }}
                />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded px-2 py-1 text-xs"
                  style={{
                    border: "solid 1px rgba(var(--center-channel-color-rgb), 0.16)",
                    background: "var(--center-channel-bg)",
                    color: "var(--center-channel-color)",
                  }}
                  aria-label="From date"
                />
                <span
                  className="text-xs"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }}
                >
                  {t("common.or", "to")}
                </span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded px-2 py-1 text-xs"
                  style={{
                    border: "solid 1px rgba(var(--center-channel-color-rgb), 0.16)",
                    background: "var(--center-channel-bg)",
                    color: "var(--center-channel-color)",
                  }}
                  aria-label="To date"
                />
              </div>
            </div>
            {dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo) && (
              <p className="mt-2 text-xs" style={{ color: "var(--dnd-indicator)" }} role="alert">
                {t("search.dateInvalid", "Start date must be before end date")}
              </p>
            )}
          </>
        )}
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mb-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="rounded-md px-4 py-2 text-xs font-medium text-white"
            style={{ background: "var(--button-bg)" }}
          >
            {t("errors.tryAgain")}
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto" aria-live="polite" aria-atomic="true">
          {loading && (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="animate-pulse space-y-2 rounded-lg p-3"
                  style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}
                >
                  <div
                    className="h-3 w-24 rounded"
                    style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)" }}
                  />
                  <div
                    className="h-4 w-3/4 rounded"
                    style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }}
                  />
                  <div
                    className="h-3 w-16 rounded"
                    style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }}
                  />
                </div>
              ))}
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <EmptyState
              icon={<SearchIcon size={20} />}
              title={t("search.noResults")}
              description={t("common.noResults")}
            />
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-2 p-4">
              <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                {tn("search.resultsCount", results.length)}
              </p>
              {results.map((r) => {
                const channel = channels.find((c) => c.id === r.channel_id);
                return (
                  <Link
                    key={r.id}
                    href={`/${params.workspaceSlug}/${channel?.slug ?? r.channel_id}`}
                    className="group block rounded-lg p-3 transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.04)]"
                  >
                    <div
                      className="mb-1 flex items-center gap-2 text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {channel && (
                        <>
                          <Hash size={12} />
                          <span>{channel.name}</span>
                          <span>&middot;</span>
                        </>
                      )}
                      <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--center-channel-color)" }}
                    >
                      <HighlightText text={r.content.slice(0, 500)} query={query} />
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
                    {loadingMore ? (
                      <span
                        className="inline-block h-3 w-3 animate-spin rounded-full border-2"
                        style={{
                          borderColor: "rgba(var(--center-channel-color-rgb), 0.3)",
                          borderTopColor: "transparent",
                        }}
                      />
                    ) : (
                      t("common.search")
                    )}
                    <ChevronDown size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: "rgba(var(--button-bg-rgb), 0.08)" }}
              >
                <SearchIcon size={24} style={{ color: "var(--button-bg)" }} />
              </div>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                {t("search.minQueryLength", "Type at least 2 characters to search")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
