"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { X, Pin, Users } from "lucide-react";
import type { Message } from "@chat/db";

interface Props {
  channelId: string;
  onClose: () => void;
}

interface MemberInfo {
  user_id: string;
  display_name?: string;
}

export function ChannelInfo({ channelId, onClose }: Props) {
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pins" | "members">("members");

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
    <div className="flex h-full w-72 flex-col border-l border-[var(--color-border-primary)] bg-[var(--color-background-primary)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--color-foreground-primary)]">
          Channel Info
        </h2>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)]"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex border-b border-[var(--color-border-primary)]">
        <button
          onClick={() => setTab("members")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${tab === "members" ? "border-b-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]" : "text-[var(--color-foreground-tertiary)] hover:text-[var(--color-foreground-primary)]"}`}
        >
          <Users size={14} className="mr-1 inline" /> Members
        </button>
        <button
          onClick={() => setTab("pins")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${tab === "pins" ? "border-b-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]" : "text-[var(--color-foreground-tertiary)] hover:text-[var(--color-foreground-primary)]"}`}
        >
          <Pin size={14} className="mr-1 inline" /> Pinned
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="animate-pulse space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[var(--color-skeleton-bg)]" />
                <div className="h-4 w-24 rounded bg-[var(--color-skeleton-bg)]" />
              </div>
            ))}
          </div>
        ) : tab === "members" ? (
          <div className="space-y-0.5">
            {members.length === 0 && (
              <p className="p-2 text-xs text-[var(--color-foreground-tertiary)]">No members</p>
            )}
            {members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--color-foreground-primary)]"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-avatar-bg)] text-xs font-medium text-[var(--color-avatar-fg)]">
                  {(m.display_name ?? m.user_id).charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{m.display_name ?? m.user_id.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {pinnedMessages.length === 0 && (
              <p className="p-2 text-xs text-[var(--color-foreground-tertiary)]">
                No pinned messages
              </p>
            )}
            {pinnedMessages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-md border border-[var(--color-border-primary)] px-2 py-1.5"
              >
                <p className="line-clamp-2 text-xs text-[var(--color-foreground-primary)]">
                  {msg.content}
                </p>
                <p className="mt-0.5 text-[10px] text-[var(--color-foreground-tertiary)]">
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
