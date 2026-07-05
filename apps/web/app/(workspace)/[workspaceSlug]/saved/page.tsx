"use client";

import React, { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { Bookmark, MessageSquare, Trash2 } from "lucide-react";
import type { Message, UserProfile } from "@chat/db";

export default function SavedMessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ messages: Message[] }>("/messages/flagged")
      .then((res) => {
        setMessages(res.messages);
        loadProfiles(res.messages);
      })
      .catch(() => console.warn("Failed to load saved messages"))
      .finally(() => setLoading(false));
  }, [user]);

  async function loadProfiles(msgs: Message[]) {
    const ids = [...new Set(msgs.map((m) => m.user_id))];
    if (ids.length === 0) return;
    try {
      const res = await api.post<{ profiles: UserProfile[] }>("/auth/profiles", { userIds: ids });
      setProfiles((prev) => {
        const next = new Map(prev);
        res.profiles.forEach((p) => next.set(p.id, p));
        return next;
      });
    } catch {
      console.warn("Failed to load profiles");
    }
  }

  async function unflag(messageId: string) {
    try {
      await api.delete(`/messages/${messageId}/flag`);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch {
      console.warn("Failed to unflag message");
    }
  }

  function name(userId: string) {
    const p = profiles.get(userId);
    return p?.display_name ?? p?.email?.split("@")[0] ?? userId.slice(0, 8);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2"
          style={{
            borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
            borderTopColor: "var(--button-bg)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <div className="flex items-center gap-2">
        <Bookmark size={20} style={{ color: "var(--button-bg)" }} />
        <h1 className="text-xl font-bold text-[var(--center-channel-color)]">Saved Messages</h1>
      </div>
      {messages.length === 0 && (
        <p className="text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
          No saved messages yet. Right-click or long-press a message and select &ldquo;Copy
          link&rdquo; or use reactions to keep track.
        </p>
      )}
      <div className="space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="flex items-start gap-3 rounded-lg border p-3"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
          >
            <MessageSquare
              size={16}
              className="mt-0.5 shrink-0"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--center-channel-color)]">
                {name(msg.user_id)}
              </p>
              <p
                className="mt-0.5 line-clamp-2 text-sm"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
              >
                {msg.content}
              </p>
              <p
                className="mt-0.5 text-xs"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                {new Date(msg.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => unflag(msg.id)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              aria-label="Unsave message"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
