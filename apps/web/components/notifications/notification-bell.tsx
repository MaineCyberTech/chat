"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { EmptyState } from "@chat/ui";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [markingAllRead, setMarkingAllRead] = useState(false);

  async function markAllRead() {
    setMarkingAllRead(true);
    try {
      await api.post("/notifications/read-all", {});
      setNotifications([]);
      setUnread(0);
    } catch {
      console.warn("Failed to mark all as read");
    } finally {
      setMarkingAllRead(false);
    }
  }

  const handleClose = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);
  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get<{ unread: number }>("/notifications/unread");
      setUnread(res.unread);
    } catch {
      console.warn("Failed to fetch unread count");
      /* ignore */
    }
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.get<{ notifications: Notification[]; unread: number }>(
        "/notifications",
      );
      setNotifications(res.notifications);
      setUnread(res.unread);
    } catch {
      console.warn("Failed to fetch notifications");
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, handleClose]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) fetchAll();
      return !prev;
    });
  }, [fetchAll]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "Tab") {
        // Focus trap within menu
        if (!menuRef.current) return;
        const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        if (!first || !last) return;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [handleClose],
  );

  async function handleMarkRead(id: string) {
    await api.patch(`/notifications/${id}/read`, {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((prev) => Math.max(0, prev - 1));
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Escape") handleClose();
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            fetchAll();
            setOpen(true);
          }
        }}
        className="relative flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg p-2 transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.08)] focus-visible:ring-2 focus-visible:ring-[rgba(var(--button-bg-rgb),0.24)] focus-visible:outline-none"
        style={{ color: "var(--text-tertiary)" }}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
            style={{
              backgroundColor: "rgba(var(--dnd-indicator-rgb),0.12)",
              color: "var(--dnd-indicator)",
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={handleKeyDown}
          className="absolute top-full right-0 z-50 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-lg border bg-[var(--center-channel-bg)] shadow-[var(--elevation-4)]"
          style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
        >
          <div
            className="flex items-center justify-between border-b px-4 py-2"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
          >
            <p className="text-sm font-semibold text-[var(--center-channel-color)]">
              Notifications
            </p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAllRead}
                className="text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ color: "var(--button-bg)" }}
              >
                {markingAllRead ? "Marking..." : "Mark all read"}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <EmptyState description="No notifications" className="!py-0" />
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  role="menuitem"
                  tabIndex={0}
                  className={`border-b px-4 py-3 transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.08)] focus-visible:ring-2 focus-visible:ring-[rgba(var(--button-bg-rgb),0.24)] focus-visible:outline-none ${n.read ? "" : ""}`}
                  style={{
                    borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                    backgroundColor: n.read ? undefined : "rgba(var(--button-bg-rgb),0.12)",
                  }}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !n.read) {
                      e.preventDefault();
                      handleMarkRead(n.id);
                    }
                  }}
                >
                  <p className="text-sm font-medium text-[var(--center-channel-color)]">
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {n.body}
                    </p>
                  )}
                  <p className="mt-1 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
