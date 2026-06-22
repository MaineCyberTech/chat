"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";

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

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get<{ unread: number }>("/notifications/unread");
      setUnread(res.unread);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.get<{ notifications: Notification[]; unread: number }>(
        "/notifications",
      );
      setNotifications(res.notifications);
      setUnread(res.unread);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    fetchAll();
  }, [fetchAll]);

  const handleClose = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

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
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === "Escape") handleClose();
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            handleOpen();
          }
        }}
        className="relative rounded p-1.5 text-[var(--color-foreground-tertiary)] transition-colors hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-status-danger-bg)] px-1 text-[10px] font-bold text-[var(--color-status-danger-fg)]">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={handleKeyDown}
          className="absolute top-full right-0 z-50 mt-1 w-80 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] shadow-[var(--shadow-xl)]"
        >
          <div className="border-b border-[var(--color-border-primary)] px-4 py-2">
            <p className="text-sm font-semibold text-[var(--color-foreground-primary)]">
              Notifications
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--color-foreground-tertiary)]">
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  role="menuitem"
                  tabIndex={0}
                  className={`border-b border-[var(--color-border-primary)] px-4 py-3 transition-colors hover:bg-[var(--color-background-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none ${n.read ? "" : "bg-[var(--color-status-info-bg)]"}`}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !n.read) {
                      e.preventDefault();
                      handleMarkRead(n.id);
                    }
                  }}
                >
                  <p className="text-sm font-medium text-[var(--color-foreground-primary)]">
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 text-xs text-[var(--color-foreground-secondary)]">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-[var(--color-foreground-tertiary)]">
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
