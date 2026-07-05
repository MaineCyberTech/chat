"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";
import { WorkspaceList } from "./workspace-list";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { ChannelList } from "@/components/channel/channel-list";
import { CreateChannelDialog } from "@/components/channel/create-channel-dialog";
import { InviteMembersModal } from "./invite-members-modal";
import { Avatar } from "@chat/ui";
import { Bookmark, PanelLeftClose, PanelLeft, Settings, Search, Plus, ChevronDown, UserPlus } from "lucide-react";
import type { Channel, Workspace } from "@chat/db";
import { api } from "@/lib/api";

interface Props {
  workspaceSlug?: string;
  channelId?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const SIDEBAR_WIDTH = 264;
const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 304;

export function AppSidebar({ workspaceSlug, channelId, mobileOpen, onMobileClose }: Props) {
  const { user, signOut } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [channelRefreshKey, setChannelRefreshKey] = useState(0);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [wsLoading, setWsLoading] = useState(false);
  const [sidebarRef, setSidebarRef] = useState<HTMLElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const collapsedRef = useRef(true);
  const userToggledRef = useRef(false);
  const [dmChannels, setDmChannels] = useState<Channel[]>([]);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [chatUsers, setChatUsers] = useState<{ id: string; display_name: string }[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userStatus, setUserStatus] = useState<{ status: string; custom_status?: string }>({
    status: "online",
  });
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [dmExpanded, setDmExpanded] = useState(true);

  // Auto-collapse sidebar at md breakpoint (768px) for tablet layout
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

  async function setStatus(status: string) {
    try {
      await api.patch("/auth/status", { status });
      setUserStatus((prev) => ({ ...prev, status }));
      setShowStatusMenu(false);
      const { getSocket } = await import("@/lib/socket");
      const s = await getSocket();
      s.emit("presence:set", status);
    } catch {
      console.warn("Failed to set status");
    }
  }

  const statusColor =
    userStatus.status === "online"
      ? "#06d6a0"
      : userStatus.status === "away"
        ? "#ffbc42"
        : userStatus.status === "dnd"
          ? "#d24b4e"
          : "rgba(175,179,192,0.75)";

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.body.classList.toggle("sidebar-mobile-open", mobileOpen);
  }, [mobileOpen]);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={onMobileClose}
        />
      )}

      <div
        id="SidebarContainer"
        ref={setSidebarRef}
        className={`flex h-full flex-col ${collapsed ? "w-[60px]" : ""}`}
        style={{
          background: "var(--sidebar-bg)",
          color: "var(--sidebar-text)",
          minWidth: collapsed ? 60 : SIDEBAR_MIN_WIDTH,
          maxWidth: collapsed ? 60 : SIDEBAR_MAX_WIDTH,
          width: collapsed ? 60 : SIDEBAR_WIDTH,
          gridArea: "team-sidebar",
          overflowX: "visible",
        }}
      >
        {/* Team/User Header */}
        <div
          className="flex items-center gap-2 px-3 py-3"
          style={{ background: "var(--sidebar-header-bg)", minHeight: collapsed ? 52 : 63 }}
        >
          {collapsed ? (
            <button
              onClick={() => {
                userToggledRef.current = true;
                setCollapsed(false);
              }}
              className="mx-auto flex h-9 w-9 items-center justify-center rounded"
              style={{ color: "var(--sidebar-header-text-color)" }}
              aria-label="Expand sidebar"
            >
              <PanelLeft size={18} />
            </button>
          ) : (
            <>
              <div className="relative shrink-0">
                <Avatar fallback={user?.email ?? "?"} size="sm" />
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2"
                  style={{
                    background: statusColor,
                    borderColor: "var(--sidebar-header-bg)",
                  }}
                  aria-label={`Status: ${userStatus.status}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold" style={{ fontSize: 16, lineHeight: "22px", color: "var(--sidebar-header-text-color)" }}>
                  {user?.email?.split("@")[0] ?? "Chat"}
                </div>
                <div style={{ fontSize: 14, color: "rgba(var(--sidebar-header-text-color-rgb), 0.8)" }}>
                  {userStatus.custom_status || `${userStatus.status}`}
                </div>
              </div>
              <button
                onClick={() => {
                  userToggledRef.current = true;
                  setCollapsed(true);
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
                style={{ color: "var(--sidebar-header-text-color)" }}
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={14} />
              </button>
            </>
          )}
        </div>

        {/* Channel Navigator (Jump to / search) */}
        {!collapsed && workspaceSlug && (
          <div className="px-3 py-2">
            <div
              className="flex h-9 items-center gap-2 rounded px-2 text-sm"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.72)",
                cursor: "pointer",
              }}
              onClick={() => {
                const event = new CustomEvent("chat:search-open");
                document.dispatchEvent(event);
              }}
              role="button"
              aria-label="Jump to channel or user"
            >
              <Search size={14} />
              <span style={{ fontSize: 13 }}>Jump to...</span>
            </div>
            <button
              onClick={() => {
                if (workspace) setShowInviteModal(true);
              }}
              className="mt-1 flex h-9 w-full items-center gap-2 rounded px-2 text-sm"
              style={{
                color: "rgba(255,255,255,0.72)",
              }}
              aria-label="Invite members"
            >
              <UserPlus size={14} />
              <span style={{ fontSize: 13 }}>Invite people</span>
            </button>
          </div>
        )}

        {/* Scrollable navigation area */}
        <div className="flex-1 overflow-y-auto py-1">
          {/* Workspaces section */}
          {!collapsed && (
            <div className="mb-2">
              <div className="mm-sidebar-group-header">
                Workspaces
              </div>
              <div key={refreshKey}>
                <WorkspaceList activeSlug={workspaceSlug} />
              </div>
              <div className="px-3 mt-1">
                <CreateWorkspaceDialog onCreated={handleCreated} />
              </div>
            </div>
          )}

          {/* Channels section */}
          {workspaceSlug && !collapsed && (
            <div className="mb-2">
              <button
                onClick={() => setChannelsExpanded(!channelsExpanded)}
                className="mm-sidebar-group-header w-full cursor-pointer"
              >
                <ChevronDown
                  size={12}
                  className="mr-1"
                  style={{
                    transform: channelsExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                    transition: "transform 200ms",
                  }}
                />
                Channels
              </button>
              {channelsExpanded && (
                <>
                  {wsLoading || !workspace ? (
                    <div className="space-y-1 px-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-7 animate-pulse rounded"
                          style={{ background: "rgba(255,255,255,0.08)" }}
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
                    <div className="px-3 mt-1">
                      <CreateChannelDialog
                        workspaceId={workspace.id}
                        onCreated={handleChannelCreated}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Saved Messages */}
          {workspaceSlug && !collapsed && (
            <div className="mb-2">
              <div className="mm-sidebar-group-header">
                Saved
              </div>
              <Link
                href={`/${workspaceSlug}/saved`}
                className="flex items-center gap-2 rounded-md px-5 py-1.5 text-sm transition-colors"
                style={{
                  color: "var(--sidebar-text)",
                  opacity: 0.8,
                }}
              >
                <Bookmark size={14} />
                <span>Saved Messages</span>
              </Link>
            </div>
          )}

          {/* Direct Messages section */}
          {workspaceSlug && !collapsed && (
            <div className="mb-2">
              <button
                onClick={() => setDmExpanded(!dmExpanded)}
                className="mm-sidebar-group-header w-full cursor-pointer"
              >
                <ChevronDown
                  size={12}
                  className="mr-1"
                  style={{
                    transform: dmExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                    transition: "transform 200ms",
                  }}
                />
                Direct Messages
              </button>
              {dmExpanded && (
                <>
                  {dmChannels.length > 0 ? (
                    <ul role="listbox" aria-label="Direct messages">
                      {dmChannels.map((ch) => (
                        <li key={ch.id} role="option" aria-selected={channelId === ch.id}>
                          <Link
                            href={`/${workspaceSlug}/${ch.slug}`}
                            className="mm-sidebar-channel rounded-md px-5 text-sm transition-colors"
                            style={{
                              color: channelId === ch.id ? "var(--sidebar-text-active-color)" : "var(--sidebar-text)",
                              background: channelId === ch.id ? "rgba(255,255,255,0.12)" : "transparent",
                              fontWeight: channelId === ch.id ? 600 : 400,
                            }}
                          >
                            <span className="mr-2">&#x1f4ac;</span>
                            <span className="truncate">{ch.name.replace(/^dm-/, "")}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-5 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                      No direct messages yet
                    </p>
                  )}
                  <button
                    onClick={() => setShowUserPicker(true)}
                    className="flex w-full items-center gap-2 rounded px-5 py-1.5 text-sm"
                    style={{ color: "rgba(255,255,255,0.72)" }}
                  >
                    <Plus size={14} />
                    <span>New DM</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* User picker for starting DM or GM */}
          {showUserPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
              <div className="w-full max-w-sm rounded-lg p-4 shadow-[var(--elevation-5)]" style={{ background: "var(--center-channel-bg)", color: "var(--center-channel-color)" }}>
                <h3 className="mb-2 text-sm font-semibold">Start a conversation</h3>
                <p className="mb-2 text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
                  Click a name for a DM, or select multiple for a group chat
                </p>
                <div className="max-h-48 space-y-0.5 overflow-y-auto">
                  {chatUsers.length === 0 && (
                    <p className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
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
                      className="w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors"
                      style={{
                        background: selectedUserIds.has(u.id) ? `rgba(var(--button-bg-rgb), 0.08)` : "transparent",
                        color: selectedUserIds.has(u.id) ? "var(--link-color)" : "var(--center-channel-color)",
                      }}
                    >
                      <span className="mr-2">{selectedUserIds.has(u.id) ? "\u2713" : "+"}</span>
                      {u.display_name ?? u.id.slice(0, 8)}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  {selectedUserIds.size > 0 && (
                    <button
                      onClick={createGroupChat}
                      className="flex-1 rounded-md px-3 py-1.5 text-xs font-medium text-white"
                      style={{ background: "var(--button-bg)" }}
                    >
                      Start group ({selectedUserIds.size})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowUserPicker(false);
                      setSelectedUserIds(new Set());
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${selectedUserIds.size > 0 ? "flex-1" : "w-full"}`}
                    style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {workspace && showInviteModal && (
            <InviteMembersModal
              workspaceId={workspace.id}
              onClose={() => setShowInviteModal(false)}
            />
          )}
        </div>

        {/* Status picker popup */}
        {showStatusMenu && (
          <div
            ref={statusMenuRef}
            className="absolute left-3 z-50 mt-1 w-40 rounded-lg border p-1 shadow-[var(--elevation-3)]"
            style={{
              background: "var(--center-channel-bg)",
              borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
              bottom: "48px",
            }}
          >
            {[
              { key: "online", label: "Online", color: "#06d6a0" },
              { key: "away", label: "Away", color: "#ffbc42" },
              { key: "dnd", label: "Do Not Disturb", color: "#d24b4e" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setStatus(s.key)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm`}
                style={{
                  color: "var(--center-channel-color)",
                  background: userStatus.status === s.key ? "rgba(var(--center-channel-color-rgb), 0.08)" : "transparent",
                }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        {!collapsed && (
          <div style={{ borderTop: "solid 1px rgba(255,255,255,0.12)" }} className="px-3 py-2">
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              <Link href="/" className="hover:opacity-80">
                Chat Platform
              </Link>
              <span className="ml-auto flex gap-1">
                <button
                  onClick={signOut}
                  className="hover:opacity-80"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Logout
                </button>
                {workspaceSlug && (
                  <Link
                    href={`/${workspaceSlug}/settings`}
                    className="hover:opacity-80"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    <Settings size={14} />
                  </Link>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
