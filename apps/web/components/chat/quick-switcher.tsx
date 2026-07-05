"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Hash, Search, User, X } from "lucide-react";
import type { Channel } from "@chat/db";

interface Props {
  workspaceSlug: string;
  open: boolean;
  onClose: () => void;
}

interface UserResult {
  id: string;
  display_name: string;
}

export function QuickSwitcher({ workspaceSlug, open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
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
        Promise.all([
          api.get<{ channels: Channel[] }>(`/workspaces/${ws.id}/channels`),
          api.get<{ members: UserResult[] }>(`/workspaces/${ws.id}/members`),
        ])
          .then(([chRes, memberRes]) => {
            setChannels(chRes.channels);
            setUsers(memberRes.members);
          })
          .catch(() => {});
      })
      .catch(() => {});
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, workspaceSlug]);

  const filteredChannels = React.useMemo(() => {
    if (!query.trim()) return channels.slice(0, 10);
    const q = query.toLowerCase();
    return channels
      .filter(
        (c) => c.name.toLowerCase().includes(q) || (c.topic && c.topic.toLowerCase().includes(q)),
      )
      .slice(0, 20);
  }, [query, channels]);

  const filteredUsers = React.useMemo(() => {
    if (!query.trim()) return [] as UserResult[];
    const q = query.toLowerCase();
    return users.filter((u) => u.display_name.toLowerCase().includes(q)).slice(0, 5);
  }, [query, users]);

  const totalItems = filteredChannels.length + filteredUsers.length;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, totalItems - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex < filteredChannels.length) {
          const ch = filteredChannels[selectedIndex];
          if (ch) {
            router.push(`/${workspaceSlug}/${ch.slug}`);
            onClose();
          }
        } else {
          const userIdx = selectedIndex - filteredChannels.length;
          const user = filteredUsers[userIdx];
          if (user) {
            router.push(`/${workspaceSlug}/@${user.id}`);
            onClose();
          }
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [filteredChannels, filteredUsers, selectedIndex, totalItems, workspaceSlug, router, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(0,0,0,0.5)] pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border shadow-[var(--elevation-5)]"
        style={{
          background: "var(--center-channel-bg)",
          borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
          color: "var(--center-channel-color)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Quick switcher"
      >
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ borderBottom: "1px solid rgba(var(--center-channel-color-rgb), 0.16)" }}
        >
          <Search
            size={16}
            className="shrink-0"
            style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search channels and users..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: "var(--center-channel-color)" }}
            aria-label="Search channels and users"
          />
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded"
            style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {totalItems === 0 && (
            <p
              className="px-3 py-4 text-center text-xs"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
            >
              {query ? "No results found" : "No channels available"}
            </p>
          )}
          {filteredChannels.length > 0 && (
            <>
              <p
                className="px-3 py-1 text-xs font-medium"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                Channels
              </p>
              {filteredChannels.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    router.push(`/${workspaceSlug}/${ch.slug}`);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                    i === selectedIndex
                      ? ""
                      : "hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                  }`}
                  style={{
                    background:
                      i === selectedIndex ? "rgba(var(--button-bg-rgb), 0.12)" : "transparent",
                    color: "var(--center-channel-color)",
                  }}
                >
                  <Hash
                    size={14}
                    className="shrink-0"
                    style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                  />
                  <span className="min-w-0 truncate font-medium">{ch.name}</span>
                  {ch.topic && (
                    <span
                      className="ml-auto truncate text-xs"
                      style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                    >
                      {ch.topic}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
          {filteredUsers.length > 0 && (
            <>
              <p
                className="px-3 py-1 text-xs font-medium"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                Users
              </p>
              {filteredUsers.map((u, i) => {
                const idx = filteredChannels.length + i;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      router.push(`/${workspaceSlug}/@${u.id}`);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                      idx === selectedIndex
                        ? ""
                        : "hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                    }`}
                    style={{
                      background:
                        idx === selectedIndex ? "rgba(var(--button-bg-rgb), 0.12)" : "transparent",
                      color: "var(--center-channel-color)",
                    }}
                  >
                    <User
                      size={14}
                      className="shrink-0"
                      style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                    />
                    <span className="min-w-0 truncate font-medium">{u.display_name}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
