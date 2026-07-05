"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { X, Mail, Calendar } from "lucide-react";
import type { UserProfile } from "@chat/db";

interface Props {
  userId: string;
  onClose: () => void;
  anchorEl: HTMLElement;
}

export function ProfilePopover({ userId, onClose, anchorEl }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.post<{ profiles: UserProfile[] }>("/auth/profiles", { userIds: [userId] }),
      api
        .get<{ status: { emoji: string; text: string } | null }>("/status")
        .catch(() => ({ status: null })),
    ])
      .then(([profileRes]) => {
        setProfile(profileRes.profiles[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  // Position popover relative to anchor
  useEffect(() => {
    if (!popoverRef.current || !anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const popover = popoverRef.current;
    popover.style.left = `${Math.min(rect.left, window.innerWidth - 280)}px`;
    popover.style.top = `${rect.bottom + 4}px`;
  }, [anchorEl, loading]);

  // Close on click outside and Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        e.target !== anchorEl
      ) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose, anchorEl]);

  if (loading) {
    return (
      <div
        ref={popoverRef}
        className="fixed z-50 w-64 rounded-lg border bg-[var(--center-channel-bg)] p-4 shadow-[var(--elevation-4)]"
        style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
      >
        <div className="animate-pulse space-y-2">
          <div className="h-10 w-10 rounded-full bg-[var(--color-skeleton-bg)]" />
          <div className="h-4 w-32 rounded bg-[var(--color-skeleton-bg)]" />
          <div className="h-3 w-24 rounded bg-[var(--color-skeleton-bg)]" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-64 rounded-lg border bg-[var(--center-channel-bg)] p-4 shadow-[var(--elevation-4)]"
      style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
      role="dialog"
      aria-label={`${profile.display_name ?? "User"} profile`}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
        style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
        aria-label="Close profile"
      >
        <X size={14} />
      </button>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-avatar-bg)] text-sm font-medium text-[var(--color-avatar-fg)]">
          {(profile.display_name ?? profile.id).charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--center-channel-color)]">
            {profile.display_name ?? "Unknown"}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
        >
          <Mail size={12} /> {profile.email ?? "No email"}
        </div>
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
        >
          <Calendar size={12} /> Joined {"Unknown"}
        </div>
      </div>
    </div>
  );
}
