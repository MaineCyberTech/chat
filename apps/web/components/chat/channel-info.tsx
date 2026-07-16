"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { X, Pin, Users, Bookmark, UserPlus } from "lucide-react";
import { ChannelBookmarks } from "./channel-bookmarks";
import { EmptyState, Button } from "@chat/ui";
import { InviteMembersModal } from "@/components/workspace/invite-members-modal";
import type { Message } from "@chat/db";

interface Props {
  channelId: string;
  workspaceId?: string;
  onClose: () => void;
  initialTab?: "members" | "pins" | "bookmarks";
}

interface MemberInfo {
  user_id: string;
  display_name?: string;
}

export function ChannelInfo({ channelId, workspaceId, onClose, initialTab = "members" }: Props) {
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [tab, setTab] = useState<"pins" | "members" | "bookmarks">(initialTab);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<{ messages: Message[] }>(`/channels/${channelId}/pinned`),
      api.get<{ members: MemberInfo[] }>(`/channels/${channelId}/members`),
    ])
      .then(([pinnedRes, memberRes]) => {
        setPinnedMessages(pinnedRes.messages);
        setMembers(memberRes.members);
      })
      .catch((err) => {
        setError(err.message || "Failed to load channel info");
        setPinnedMessages([]);
        setMembers([]);
      })
      .finally(() => setLoading(false));
  }, [channelId, retryCount]);

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
        role="tablist"
        style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.12)" }}
      >
        <button
          role="tab"
          aria-selected={tab === "members"}
          aria-controls="tabpanel-members"
          onClick={() => setTab("members")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${tab === "members" ? "border-b-2" : ""}`}
          style={{
            color: tab === "members" ? "var(--button-bg)" : "var(--text-tertiary)",
            borderColor: tab === "members" ? "var(--button-bg)" : "transparent",
          }}
        >
          <Users size={14} className="mr-1 inline" /> Members
        </button>
        <button
          role="tab"
          aria-selected={tab === "pins"}
          aria-controls="tabpanel-pins"
          onClick={() => setTab("pins")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${tab === "pins" ? "border-b-2" : ""}`}
          style={{
            color: tab === "pins" ? "var(--button-bg)" : "var(--text-tertiary)",
            borderColor: tab === "pins" ? "var(--button-bg)" : "transparent",
          }}
        >
          <Pin size={14} className="mr-1 inline" /> Pinned
        </button>
        <button
          role="tab"
          aria-selected={tab === "bookmarks"}
          aria-controls="tabpanel-bookmarks"
          onClick={() => setTab("bookmarks")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${tab === "bookmarks" ? "border-b-2" : ""}`}
          style={{
            color: tab === "bookmarks" ? "var(--button-bg)" : "var(--text-tertiary)",
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
        {error ? (
          <div className="flex flex-col items-center justify-center gap-3 p-4 text-center">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{error}</p>
            <Button variant="secondary" size="sm" onClick={() => setRetryCount((c) => c + 1)}>
              Retry
            </Button>
          </div>
        ) : loading ? (
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
          <div className="space-y-0.5" role="tabpanel" id="tabpanel-members">
            {members.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-3">
                <EmptyState description="No members yet" className="py-3" />
                {workspaceId && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowInviteModal(true)}
                      aria-label="Invite members"
                    >
                      <UserPlus size={14} className="mr-1" />
                      Invite members
                    </Button>
                    {showInviteModal && (
                      <InviteMembersModal
                        workspaceId={workspaceId}
                        onClose={() => setShowInviteModal(false)}
                      />
                    )}
                  </>
                )}
              </div>
            ) : (
              members.map((m) => (
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
              ))
            )}
          </div>
        ) : (
          <div className="space-y-1" role="tabpanel" id="tabpanel-pins">
            {pinnedMessages.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-3">
                <EmptyState description="No pinned messages yet" className="py-3" />
                <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  Pin a message from its context menu
                </p>
              </div>
            ) : (
              pinnedMessages.map((msg) => (
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
                  <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    <time dateTime={new Date(msg.created_at).toISOString()}>{new Date(msg.created_at).toLocaleDateString()}</time>
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
