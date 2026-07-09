"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { EmptyState } from "@chat/ui";
import { Clock, Trash2, ChevronRight } from "lucide-react";

interface ScheduledPost {
  id: string;
  channel_id: string;
  content: string;
  scheduled_at: string;
  created_at: string;
}

interface ChannelInfo {
  id: string;
  name: string;
  slug: string;
}

export default function ScheduledPostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [channels, setChannels] = useState<Map<string, ChannelInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get<{ posts: ScheduledPost[] }>("/scheduled-posts"),
      api.get<{ workspaces: { id: string }[] }>("/workspaces").then(async (wsRes) => {
        const m = new Map<string, ChannelInfo>();
        for (const ws of wsRes.workspaces) {
          try {
            const chRes = await api.get<{ channels: ChannelInfo[] }>(
              `/workspaces/${ws.id}/channels`,
            );
            for (const ch of chRes.channels) m.set(ch.id, ch);
          } catch {
            /* skip */
          }
        }
        return m;
      }),
    ])
      .then(([postRes, chMap]) => {
        setPosts(postRes.posts);
        setChannels(chMap);
      })
      .catch(() => console.warn("Failed to load scheduled posts"))
      .finally(() => setLoading(false));
  }, [user]);

  async function cancelPost(id: string) {
    setCancelling(id);
    try {
      await api.delete(`/scheduled-posts/${id}`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      console.warn("Failed to cancel post");
    } finally {
      setCancelling(null);
    }
  }

  if (loading) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
      >
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
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ color: "var(--center-channel-color)" }}>
        <Clock size={24} className="mr-2 inline" />
        Scheduled Messages
      </h1>

      {posts.length === 0 ? (
        <EmptyState description="No scheduled messages. Schedule a message by clicking the clock icon in the message input." className="!py-0" />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const ch = channels.get(post.channel_id);
            const sched = new Date(post.scheduled_at);
            return (
              <div
                key={post.id}
                className="flex items-start gap-3 rounded-lg border p-3"
                style={{
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  background: "var(--center-channel-bg)",
                }}
              >
                <Clock
                  size={16}
                  className="mt-0.5 shrink-0"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                  >
                    {ch ? (
                      <Link
                        href={`/${ch.slug}`}
                        className="flex items-center gap-1 hover:underline"
                        style={{ color: "var(--button-bg)" }}
                      >
                        # {ch.name} <ChevronRight size={10} />
                      </Link>
                    ) : (
                      <span>Unknown channel</span>
                    )}
                    <span>&middot;</span>
                    <span>
                      {sched.toLocaleDateString()}{" "}
                      {sched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "var(--center-channel-color)" }}>
                    {post.content.replace(/<[^>]*>/g, "").slice(0, 200)}
                  </p>
                </div>
                <button
                  onClick={() => cancelPost(post.id)}
                  disabled={cancelling === post.id}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded hover:bg-[rgba(var(--dnd-indicator-rgb),0.08)] disabled:opacity-50"
                  style={{ color: "var(--dnd-indicator)" }}
                  aria-label="Cancel scheduled message"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
