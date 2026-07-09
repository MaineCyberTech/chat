"use client";

import React, { useState, useEffect } from "react";
import { X, Megaphone } from "lucide-react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

const DISMISSED_KEY = "dismissed-announcements";

function getDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function setDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export function AnnouncementBanner() {
  const params = useParams<{ workspaceSlug?: string }>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissedState] = useState<Set<string>>(getDismissed);

  useEffect(() => {
    if (!params.workspaceSlug) return;
    const wsSlug = params.workspaceSlug;
    api
      .get<{ workspaces: { id: string; slug: string }[] }>("/workspaces")
      .then((res) => {
        const workspace = res.workspaces?.find((w) => w.slug === wsSlug);
        if (!workspace) return;
        return api.get<{ announcements: Announcement[] }>(
          `/workspaces/${workspace.id}/announcements`,
        );
      })
      .then((res) => {
        if (res) setAnnouncements(res.announcements);
      })
      .catch(() => {});
  }, [params.workspaceSlug]);

  const active = announcements.find((a) => !dismissed.has(a.id));

  if (!active) return null;

  function handleDismiss(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissedState(next);
    setDismissed(next);
  }

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 text-sm"
      style={{
        background: "var(--center-channel-bg)",
        color: "var(--center-channel-color)",
        borderBottom: "var(--border-light)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: "var(--button-bg)",
          borderTopRightRadius: 2,
          borderBottomRightRadius: 2,
        }}
      />
      <div className="mt-0.5 shrink-0">
        <Megaphone size={16} style={{ color: "var(--button-bg)" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{active.title}</p>
        <p className="mt-0.5" style={{ opacity: 0.8 }}>
          {active.body}
        </p>
      </div>
      <button
        onClick={() => handleDismiss(active.id)}
        className="flex shrink-0 items-center justify-center rounded"
        style={{
          background: "transparent",
          color: "var(--center-channel-color)",
          opacity: 0.56,
          width: 28,
          height: 28,
        }}
        aria-label="Dismiss announcement"
      >
        <X size={16} />
      </button>
    </div>
  );
}
