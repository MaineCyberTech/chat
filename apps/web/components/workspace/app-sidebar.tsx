"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";
import { WorkspaceList } from "./workspace-list";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { ChannelList } from "@/components/channel/channel-list";
import { CreateChannelDialog } from "@/components/channel/create-channel-dialog";
import { Avatar } from "@chat/ui";
import { SidebarGroup } from "@chat/ui";
import { PanelLeftClose, PanelLeft, Settings } from "lucide-react";
import type { Channel, Workspace } from "@chat/db";
import { api } from "@/lib/api";

interface Props {
  workspaceSlug?: string;
  channelId?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ workspaceSlug, channelId, mobileOpen, onMobileClose }: Props) {
  const { user, signOut } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [channelRefreshKey, setChannelRefreshKey] = useState(0);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [wsLoading, setWsLoading] = useState(false);
  const [sidebarRef, setSidebarRef] = useState<HTMLElement | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const collapsedRef = useRef(true);
  const userToggledRef = useRef(false);
  const [dmChannels, setDmChannels] = useState<Channel[]>([]);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [chatUsers, setChatUsers] = useState<{ id: string; display_name: string }[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userStatus, setUserStatus] = useState<{ status: string; custom_status?: string }>({
    status: "online",
  });
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  // Auto-collapse sidebar at md breakpoint (768px) for tablet layout
  // Respects user manual toggles — won't override after first user interaction
  useEffect(() => {
    function handleResize() {
      if (userToggledRef.current) return;
      const width = window.innerWidth;
      if (width >= 768 && width < 1024) {
        if (!collapsedRef.current) {
          setCollapsed(true);
          collapsedRef.current = true;
        }
      } else if (width >= 1024) {
        if (collapsedRef.current) {
          setCollapsed(false);
          collapsedRef.current = false;
        }
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleChannelCreated = useCallback(() => {
    setChannelRefreshKey((k) => k + 1);
  }, []);

  // Fetch selected workspace by slug to get its ID for channel list
  React.useEffect(() => {
    if (!workspaceSlug) return;
    setWsLoading(true);
    api
      .get<{ workspaces: Workspace[] }>("/workspaces")
      .then((res) => {
        const ws = res.workspaces.find((w) => w.slug === workspaceSlug);
        setWorkspace(ws ?? null);
      })
      .catch(() => setWorkspace(null))
      .finally(() => setWsLoading(false));
  }, [workspaceSlug]);

  // Fetch DM channels
  React.useEffect(() => {
    if (!user) return;
    api
      .get<{ channels: Channel[] }>("/dm-channels")
      .then((res) => setDmChannels(res.channels))
      .catch(() => setDmChannels([]));
  }, [workspaceSlug, user]);

  // Fetch workspace members for DM creation
  React.useEffect(() => {
    if (!workspace) return;
    api
      .get<{ members: { user_id: string; display_name: string }[] }>(
        `/workspaces/${workspace.id}/members`,
      )
      .then((res) => {
        setChatUsers(
          res.members
            .filter((m) => m.user_id !== user?.id)
            .map((m) => ({ id: m.user_id, display_name: m.display_name })),
        );
      })
      .catch(() => setChatUsers([]));
  }, [workspace, user]);

  async function startDm(targetUserId: string) {
    if (!workspace) return;
    try {
      const res = await api.post<{ channel: Channel }>(`/workspaces/${workspace.id}/dm`, {
        targetUserId,
      });
      setDmChannels((prev) => {
        if (prev.find((c) => c.id === res.channel.id)) return prev;
        return [res.channel, ...prev];
      });
      setShowUserPicker(false);
      window.location.href = `/${workspaceSlug}/${res.channel.slug}`;
    } catch {
      console.warn("Failed to create DM channel");
    }
  }

  async function createGroupChat() {
    if (!workspace || selectedUserIds.size === 0) return;
    const targetUserIds = Array.from(selectedUserIds);
    try {
      const res = await api.post<{ channel: Channel }>(`/workspaces/${workspace.id}/gm`, {
        targetUserIds,
      });
      setDmChannels((prev) => {
        if (prev.find((c) => c.id === res.channel.id)) return prev;
        return [res.channel, ...prev];
      });
      setShowUserPicker(false);
      setSelectedUserIds(new Set());
      window.location.href = `/${workspaceSlug}/${res.channel.slug}`;
    } catch {
      console.warn("Failed to create group chat");
    }
  }

  function toggleUserSelection(userId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  // Fetch user status
  React.useEffect(() => {
    api
      .get<{ status: { status: string; custom_status?: string } }>("/auth/status")
      .then((res) => setUserStatus(res.status))
      .catch(() => {});
  }, []);

  // Fetch user status
  React.useEffect(() => {
    api
      .get<{ status: { status: string; custom_status?: string } }>("/auth/status")
      .then((res) => setUserStatus(res.status))
      .catch(() => {});
  }, []);

  async function setStatus(status: string) {
    try {
      await api.patch("/auth/status", { status });
      setUserStatus((prev) => ({ ...prev, status }));
      setShowStatusMenu(false);
      // Also emit via socket
      const { getSocket } = await import("@/lib/socket");
      const s = await getSocket();
      s.emit("presence:set", status);
    } catch {
      console.warn("Failed to set status");
    }
  }

  const statusColor =
    userStatus.status === "online"
      ? "bg-green-500"
      : userStatus.status === "away"
        ? "bg-yellow-500"
        : userStatus.status === "dnd"
          ? "bg-red-500"
          : "bg-gray-400";

  // Close status menu on click outside
  useEffect(() => {
    if (!showStatusMenu) return;
    function handleClick(e: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showStatusMenu]);

  // Focus trap for mobile sidebar
  useEffect(() => {
    if (!mobileOpen || !sidebarRef) return;

    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const container = sidebarRef;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0]!;
      const last = focusableElements[focusableElements.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    const first = container.querySelector<HTMLElement>(focusableSelector);
    first?.focus();

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, sidebarRef]);

  // Toggle body scroll lock class for mobile sidebar
  useEffect(() => {
    if (typeof window === "undefined") return;
    document.body.classList.toggle("sidebar-mobile-open", mobileOpen);
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-[var(--color-dialog-overlay)] md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        ref={setSidebarRef}
        id="sidebar"
        className={`flex h-full flex-col border-r border-[var(--color-border-primary)] bg-[var(--color-background-secondary)] transition-all duration-200 ${
          collapsed ? "w-14" : "w-60"
        } ${
          mobileOpen === undefined
            ? ""
            : mobileOpen
              ? "mobile-open animate-slide-in-left fixed inset-y-0 left-0 z-40"
              : "hidden md:flex"
        }`}
      >
        {/* User area */}
        <div className="relative flex items-center gap-2 border-b border-[var(--color-border-primary)] px-3 py-3">
          {!collapsed && (
            <div className="relative shrink-0">
              <Avatar fallback={user?.email ?? "?"} size="sm" />
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-[var(--color-background-secondary)] ${statusColor}`}
                aria-label={`Status: ${userStatus.status}`}
                title={`Status: ${userStatus.status}`}
              />
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-[var(--color-foreground-primary)]">
                {user?.email ?? "Chat"}
              </span>
              {userStatus.custom_status && (
                <span className="block truncate text-xs text-[var(--color-foreground-tertiary)]">
                  {userStatus.custom_status}
                </span>
              )}
            </div>
          )}
          {collapsed && (
            <button
              onClick={() => {
                userToggledRef.current = true;
                setCollapsed(false);
              }}
              className="mx-auto flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg p-2 text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)]"
              aria-label="Expand sidebar"
            >
              <PanelLeft size={18} />
            </button>
          )}
          {!collapsed && (
            <>
              <button
                onClick={() => {
                  userToggledRef.current = true;
                  setCollapsed(true);
                }}
                className="hidden min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg p-2 text-xs text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] md:flex"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={14} />
              </button>
              {workspaceSlug && (
                <Link
                  href={`/${workspaceSlug}/settings`}
                  className="flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg p-2 text-xs text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)]"
                  aria-label="Settings"
                >
                  <Settings size={14} />
                </Link>
              )}
              <button
                onClick={signOut}
                className="shrink-0 rounded px-2 py-1 text-xs text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)]"
              >
                Logout
              </button>
            </>
          )}

          {/* Status picker popup */}
          {showStatusMenu && (
            <div
              ref={statusMenuRef}
              className="absolute top-full left-3 z-50 mt-1 w-40 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] p-1 shadow-[var(--shadow-xl)]"
            >
              {[
                { key: "online", label: "Online", color: "bg-green-500" },
                { key: "away", label: "Away", color: "bg-yellow-500" },
                { key: "dnd", label: "Do Not Disturb", color: "bg-red-500" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatus(s.key)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--color-foreground-primary)] hover:bg-[var(--color-background-tertiary)] ${
                    userStatus.status === s.key ? "bg-[var(--color-background-tertiary)]" : ""
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Workspace section */}
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarGroup title="Workspaces" defaultOpen>
            <div key={refreshKey}>
              <WorkspaceList activeSlug={workspaceSlug} />
            </div>
            <div className="mt-1">
              <CreateWorkspaceDialog onCreated={handleCreated} />
            </div>
          </SidebarGroup>

          {/* Channel section (shown when a workspace is selected) */}
          {workspaceSlug && (
            <SidebarGroup title="Channels" defaultOpen>
              {wsLoading || !workspace ? (
                <div className="space-y-1 px-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-7 animate-pulse rounded bg-[var(--color-skeleton-bg)]"
                    />
                  ))}
                </div>
              ) : (
                <div key={channelRefreshKey}>
                  <ChannelList
                    workspaceSlug={workspaceSlug}
                    workspaceId={workspace.id}
                    activeChannelId={channelId}
                  />
                </div>
              )}
              {workspace && (
                <div className="mt-1">
                  <CreateChannelDialog
                    workspaceId={workspace.id}
                    onCreated={handleChannelCreated}
                  />
                </div>
              )}
            </SidebarGroup>
          )}

          {/* Direct Messages section */}
          {workspaceSlug && (
            <SidebarGroup title="Direct Messages" defaultOpen>
              {dmChannels.length > 0 ? (
                <ul className="space-y-0.5" role="listbox" aria-label="Direct messages">
                  {dmChannels.map((ch) => (
                    <li key={ch.id} role="option" aria-selected={channelId === ch.id}>
                      <Link
                        href={`/${workspaceSlug}/${ch.slug}`}
                        className={`block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-[var(--color-background-tertiary)] ${
                          channelId === ch.id
                            ? "bg-[var(--color-background-tertiary)] font-medium"
                            : "text-[var(--color-foreground-secondary)]"
                        }`}
                      >
                        <span className="mr-1">💬</span> {ch.name.replace(/^dm-/, "")}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-2 text-xs text-[var(--color-foreground-tertiary)]">
                  No direct messages yet
                </p>
              )}
              {!collapsed && (
                <button
                  onClick={() => setShowUserPicker(true)}
                  className="mt-1 w-full rounded-md px-3 py-1 text-left text-xs text-[var(--color-foreground-tertiary)] transition-colors hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
                >
                  + New DM
                </button>
              )}
            </SidebarGroup>
          )}

          {/* User picker for starting DM or GM */}
          {showUserPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-dialog-overlay)] p-4">
              <div className="w-full max-w-sm rounded-lg bg-[var(--color-dialog-bg)] p-4 shadow-[var(--shadow-xl)]">
                <h3 className="mb-2 text-sm font-semibold text-[var(--color-foreground-primary)]">
                  Start a conversation
                </h3>
                <p className="mb-2 text-xs text-[var(--color-foreground-tertiary)]">
                  Click a name for a DM, or select multiple for a group chat
                </p>
                <div className="max-h-48 space-y-0.5 overflow-y-auto">
                  {chatUsers.length === 0 && (
                    <p className="text-xs text-[var(--color-foreground-tertiary)]">
                      No other members found
                    </p>
                  )}
                  {chatUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        if (selectedUserIds.size === 0) {
                          startDm(u.id);
                        } else {
                          toggleUserSelection(u.id);
                        }
                      }}
                      className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-[var(--color-background-tertiary)] ${
                        selectedUserIds.has(u.id)
                          ? "bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]"
                          : "text-[var(--color-foreground-primary)]"
                      }`}
                    >
                      <span className="mr-2">{selectedUserIds.has(u.id) ? "✓" : "+"}</span>
                      {u.display_name ?? u.id.slice(0, 8)}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  {selectedUserIds.size > 0 && (
                    <button
                      onClick={createGroupChat}
                      className="flex-1 rounded-md bg-[var(--color-brand-primary)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                    >
                      Start group ({selectedUserIds.size})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowUserPicker(false);
                      setSelectedUserIds(new Set());
                    }}
                    className={`rounded-md bg-[var(--color-background-tertiary)] px-3 py-1.5 text-xs font-medium text-[var(--color-foreground-primary)] hover:bg-[var(--color-background-tertiary)] ${
                      selectedUserIds.size > 0 ? "flex-1" : "w-full"
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--color-border-primary)] px-3 py-2">
          <Link
            href="/"
            className="text-xs text-[var(--color-sidebar-title-fg)] transition-colors hover:text-[var(--color-sidebar-title-fg-hover)]"
          >
            Chat Platform
          </Link>
        </div>
      </aside>
    </>
  );
}
