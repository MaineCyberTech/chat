"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

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

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get<{ messages: SearchResult[] }>(
          `/messages/search?q=${encodeURIComponent(q)}&workspace_id=${workspaceId}`,
        );
        // Fetch channel slugs to build correct links
        const channels = await api.get<{ channels: { id: string; slug: string }[] }>(
          `/workspaces/${workspaceId}/channels`,
        );
        const slugMap = new Map(channels.channels.map((c) => [c.id, c.slug]));
        setResults(res.messages.map((m) => ({ ...m, channel_slug: slugMap.get(m.channel_id) })));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [workspaceId],
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          search(e.target.value);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Search messages..."
        className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:focus:bg-gray-900"
      />
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/${workspaceSlug}/${r.channel_slug ?? r.channel_id}`}
              className="block border-b border-gray-100 px-4 py-2 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
            >
              <p className="text-sm">{r.content.slice(0, 100)}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
      {loading && <p className="mt-1 text-xs text-gray-400">Searching...</p>}
    </div>
  );
}
