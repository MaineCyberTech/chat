"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { X, Pin, Users, Bookmark } from "lucide-react";
import { ChannelBookmarks } from "./channel-bookmarks";
import { EmptyState } from "@chat/ui";
import type { Message } from "@chat/db";

interface Props {
  channelId: string;
  onClose: () => void;
  initialTab?: "members" | "pins" | "bookmarks";
}

interface MemberInfo {
  user_id: string;
  display_name?: string;
}

export function ChannelInfo({ channelId, onClose, initialTab = "members" }: Props) {
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pins" | "members" | "bookmarks">(initialTab);

  useEffect(() => {
    Promise.all([
      api
        .get<{ messages: Message[] }>(`/channels/${channelId}/pinned`)
        .catch(() => ({ messages: [] })),
      api
        .get<{ members: MemberInfo[] }>(`/channels/${channelId}/members`)
        .catch(() => ({ members: [] })),
    ])
      .then(([pinnedRes, memberRes]) => {
        setPinnedMessages(pinnedRes.messages);
        setMembers(memberRes.members);
      })
      .finally(() => setLoading(false));
  }, [channelId]);

  return (
    <div
      className="sidebar--right"
      style={{ width: 320, display: "flex", flexDirection: "column", height: "100%" }}
    >
      <div
        className="sidebar--right__header"
        style={{
          display: "flex",
          overflow: "hidden",
          flex: "0 0 56px",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px 0 0",
          borderBottom: "var(--border-default)",
        }}
      >
        <h2 className="px-4 text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>
          Channel Info
        </h2>
        <button onClick={onClose} className="mm-button-icon" aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <div
        className="flex border-b"
        style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.12)" }}
      >
        <button
          onClick={() => setTab("members")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${tab === "members" ? "border-b-2" : ""}`}
          style={{
            color:
              tab === "members"
                ? "var(--button-bg)"
                : "rgba(var(--center-channel-color-rgb), 0.56)",
            borderColor: tab === "members" ? "var(--button-bg)" : "transparent",
          }}
        >
          <Users size={14} className="mr-1 inline" /> Members
        </button>
        <button
          onClick={() => setTab("pins")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${tab === "pins" ? "border-b-2" : ""}`}
          style={{
            color:
              tab === "pins" ? "var(--button-bg)" : "rgba(var(--center-channel-color-rgb), 0.56)",
            borderColor: tab === "pins" ? "var(--button-bg)" : "transparent",
          }}
        >
          <Pin size={14} className="mr-1 inline" /> Pinned
        </button>
        <button
          onClick={() => setTab("bookmarks")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${tab === "bookmarks" ? "border-b-2" : ""}`}
          style={{
            color:
              tab === "bookmarks"
                ? "var(--button-bg)"
                : "rgba(var(--center-channel-color-rgb), 0.56)",
            borderColor: tab === "bookmarks" ? "var(--button-bg)" : "transparent",
          }}
        >
          <Bookmark size={14} className="mr-1 inline" /> Bookmarks
        </button>
      </div>
      <div
        className="sidebar-right__body"
        style={{ flex: "1 1 auto", overflowY: "auto", paddingTop: 8 }}
      >
        {loading ? (
          <div className="animate-pulse space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="h-8 w-8 animate-pulse rounded-full"
                  style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)" }}
                />
                <div
                  className="h-4 w-24 animate-pulse rounded"
                  style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)" }}
                />
              </div>
            ))}
          </div>
        ) : tab === "bookmarks" ? (
          <ChannelBookmarks channelId={channelId} />
        ) : tab === "members" ? (
          <div className="space-y-0.5">
            {members.length === 0 && <EmptyState description="No members yet" className="py-3" />}
            {members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.04)]"
                style={{ color: "var(--center-channel-color)" }}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-white"
                  style={{ background: "var(--button-bg)" }}
                >
                  {(m.display_name ?? m.user_id).charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{m.display_name ?? m.user_id.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {pinnedMessages.length === 0 && (
              <EmptyState description="No pinned messages" className="py-3" />
            )}
            {pinnedMessages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-md px-2 py-1.5"
                style={{ border: "var(--border-light)" }}
              >
                <p
                  className="line-clamp-2 text-xs"
                  style={{ color: "var(--center-channel-color)" }}
                >
                  {msg.content}
                </p>
                <p
                  className="mt-0.5 text-[10px]"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                >
                  {new Date(msg.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
