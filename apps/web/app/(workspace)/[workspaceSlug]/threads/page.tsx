"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Skeleton } from "@chat/ui";
import { MessageSquare, ChevronRight } from "lucide-react";

interface Thread {
  thread_metadata: {
    messages: {
      id: string;
      content: string;
      user_id: string;
      created_at: string;
      channel_id: string;
    };
    reply_count: number;
    last_reply_at: string;
  };
  last_viewed_at: string;
}

interface ChannelMap {
  [id: string]: { name: string; slug: string };
}

export default function ThreadsPage() {
  const params = useParams<{ workspaceSlug: string }>();

  useEffect(() => {
    document.title = "Threads - Chat";
  }, []);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [channels, setChannels] = useState<ChannelMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ threads: Thread[] }>("/threads"),
      api.get<{ workspaces: { id: string }[] }>("/workspaces").then(async (wsRes) => {
        const m: ChannelMap = {};
        for (const ws of wsRes.workspaces) {
          try {
            const chRes = await api.get<{ channels: { id: string; name: string; slug: string }[] }>(
              `/workspaces/${ws.id}/channels`,
            );
            for (const ch of chRes.channels) m[ch.id] = ch;
          } catch {
            /* skip */
          }
        }
        return m;
      }),
    ])
      .then(([tRes, chMap]) => {
        setThreads(tRes.threads);
        setChannels(chMap);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load threads");
        console.warn("Failed to load threads");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border p-3"
              style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
            >
              <Skeleton className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center p-6">
        <p
          className="mb-3 text-sm"
          style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
        >
          {error}
        </p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            window.location.reload();
          }}
          className="rounded-md px-4 py-2 text-xs font-medium text-white"
          style={{ background: "var(--button-bg)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold" style={{ color: "var(--center-channel-color)" }}>
        <MessageSquare size={24} className="mr-2 inline" />
        Threads
      </h1>

      {threads.length === 0 ? (
        <p className="text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
          No threads yet. Reply to a message to start a thread.
        </p>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => {
            const msg = t.thread_metadata.messages;
            const ch = channels[msg.channel_id];
            return (
              <Link
                key={msg.id}
                href={`/${params?.workspaceSlug ?? ""}/${ch?.slug ?? ""}?thread=${msg.id}`}
                className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.04)]"
                style={{
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  background: "var(--center-channel-bg)",
                }}
              >
                <MessageSquare
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
                      <span style={{ color: "var(--button-bg)" }}># {ch.name}</span>
                    ) : (
                      <span>Unknown</span>
                    )}
                    <ChevronRight size={10} />
                    <span>{new Date(t.thread_metadata.last_reply_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "var(--center-channel-color)" }}>
                    {msg.content.replace(/<[^>]*>/g, "").slice(0, 200)}
                  </p>
                  <div className="mt-1 text-xs font-medium" style={{ color: "var(--button-bg)" }}>
                    {t.thread_metadata.reply_count}{" "}
                    {t.thread_metadata.reply_count === 1 ? "reply" : "replies"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
