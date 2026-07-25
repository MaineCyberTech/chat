"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { WorkspaceList } from "./workspace-list";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { ChannelList } from "@/components/channel/channel-list";
import { CreateChannelDialog } from "@/components/channel/create-channel-dialog";
import { InviteMembersModal } from "./invite-members-modal";
import { Avatar, useToast } from "@chat/ui";
import {
  Bookmark,
  Clock,
  MessageSquare,
  Users,
  PanelLeftClose,
  PanelLeft,
  Settings,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  UserPlus,
  Shield,
  Pencil,
} from "lucide-react";
import type { Channel, Workspace } from "@chat/db";
import { UserPickerModal } from "@/components/groups/user-picker-modal";
import { api } from "@/lib/api";
import { t } from "@/lib/i18n";
import { usePresence, statusColor as presenceColor, statusClass } from "@/lib/use-presence";

const statusI18nKeys: Record<string, string> = {
  online: "status.online",
  away: "status.away",
  dnd: "status.doNotDisturb",
  offline: "status.offline",
};

interface Props {
  workspaceSlug?: string;
  channelId?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export function AppSidebar({
  workspaceSlug,
  channelId,
  mobileOpen,
  onMobileClose: _onMobileClose,
  collapsed: _collapsed,
  onToggleCollapse,
}: Props) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { addToast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [channelRefreshKey, setChannelRefreshKey] = useState(0);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [wsLoading, setWsLoading] = useState(false);
  const [sidebarRef, setSidebarRef] = useState<HTMLElement | null>(null);
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const collapsed = _collapsed ?? localCollapsed;
  const collapsedRef = useRef(true);
  const userToggledRef = useRef(false);

  const [dmChannels, setDmChannels] = useState<
    (Channel & {
      otherMembers: { user_id: string; display_name: string | null; avatar_url: string | null }[];
    })[]
  >([]);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [chatUsers, setChatUsers] = useState<{ id: string; display_name: string }[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userStatus, setUserStatus] = useState<{ status: string; custom_status?: string }>({
    status: "online",
  });
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; sort_order: number; channels: string[] }>
  >([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [dragCatId, setDragCatId] = useState<string | null>(null);
  const [dragCatOverId, setDragCatOverId] = useState<string | null>(null);
  const dragCatNode = useRef<HTMLElement | null>(null);
  const [showTeamMenu, setShowTeamMenu] = useState(false);
  const teamMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const [dmExpanded, setDmExpanded] = useState(true);
  const [wsExpanded, setWsExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar:ws-expanded") !== "false";
    }
    return true;
  });
  const [showUnreads, setShowUnreads] = useState(false);
  const [unreads, setUnreads] = useState<Map<string, { count: number; mentions: number }>>(
    new Map(),
  );
  const unreadChannelIds = useMemo(() => new Set(unreads.keys()), [unreads]);
  const { getStatus } = usePresence();

  // Collapse state is controlled by parent layout when sidebarCollapsed is provided.
  // Keep internal ref in sync for local-only usage (mobile overlay).
  useEffect(() => {
    collapsedRef.current = collapsed;
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem("sidebar:ws-expanded", String(wsExpanded));
  }, [wsExpanded]);

  const handleCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleChannelCreated = useCallback(
    (_channel?: { id: string; name: string; slug: string }) => {
      setChannelRefreshKey((k) => k + 1);
    },
    [],
  );

  // Fetch selected workspace by slug to get its ID for channel list
  React.useEffect(() => {
    if (!workspaceSlug) return;
    setWsLoading(true);
    api
      .get<{ workspaces: Workspace[] }>("/workspaces")
      .then((res) => {
        setWorkspaces(res.workspaces);
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
      .get<{
        channels: (Channel & {
          otherMembers: {
            user_id: string;
            display_name: string | null;
            avatar_url: string | null;
          }[];
        })[];
      }>("/dm-channels")
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

  // Fetch sidebar categories
  React.useEffect(() => {
    if (!workspace) return;
    api
      .get<{
        categories: Array<{ id: string; name: string; sort_order: number; channels: string[] }>;
      }>(`/sidebar-categories?workspace_id=${workspace.id}`)
      .then((res) => {
        setCategories(res.categories);
        setExpandedCategories(new Set(res.categories.map((c: { id: string }) => c.id)));
      })
      .catch(() => setCategories([]));
  }, [workspace]);

  async function createGroupChat() {
    if (!workspace || selectedUserIds.size === 0) return;
    const targetUserIds = Array.from(selectedUserIds);
    try {
      if (targetUserIds.length === 1) {
        const targetId = targetUserIds[0]!;
        const res = await api.post<{ channel: Channel }>(`/workspaces/${workspace.id}/dm`, {
          targetUserId: targetId,
        });
        const targetUser = chatUsers.find((u) => u.id === targetId);
        setDmChannels((prev) => {
          if (prev.find((c) => c.id === res.channel.id)) return prev;
          return [
            {
              ...res.channel,
              otherMembers: [
                {
                  user_id: targetId,
                  display_name: targetUser?.display_name ?? null,
                  avatar_url: null,
                },
              ],
            },
            ...prev,
          ];
        });
        setShowUserPicker(false);
        setSelectedUserIds(new Set());
        router.push(`/${workspaceSlug}/${res.channel.slug}`);
      } else {
        const res = await api.post<{ channel: Channel }>(`/workspaces/${workspace.id}/gm`, {
          targetUserIds,
        });
        const otherMembers = targetUserIds.map((uid) => {
          const u = chatUsers.find((cu) => cu.id === uid);
          return { user_id: uid, display_name: u?.display_name ?? null, avatar_url: null };
        });
        setDmChannels((prev) => {
          if (prev.find((c) => c.id === res.channel.id)) return prev;
          return [{ ...res.channel, otherMembers }, ...prev];
        });
        setShowUserPicker(false);
        setSelectedUserIds(new Set());
        router.push(`/${workspaceSlug}/${res.channel.slug}`);
      }
    } catch {
      addToast({ title: "Error", description: "Failed to create group chat", variant: "error" });
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
      addToast({ title: "Error", description: "Failed to set status", variant: "error" });
    }
  }

  async function createCategory() {
    if (!workspace || !newCategoryName.trim()) return;
    try {
      const res = await api.post<{
        category: { id: string; name: string; sort_order: number; channels: string[] };
      }>("/sidebar-categories", {
        workspace_id: workspace.id,
        name: newCategoryName.trim(),
      });
      setCategories((prev) => [...prev, { ...res.category, channels: [] }]);
      setExpandedCategories((prev) => new Set(prev).add(res.category.id));
      setNewCategoryName("");
      setCreatingCategory(false);
    } catch {
      addToast({ title: "Error", description: "Failed to create category", variant: "error" });
    }
  }

  async function renameCategory(id: string, name: string) {
    if (!name.trim()) return;
    try {
      await api.patch(`/sidebar-categories/${id}`, { name: name.trim() });
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)));
      setRenamingCategory(null);
    } catch {
      addToast({ title: "Error", description: "Failed to rename category", variant: "error" });
    }
  }

  async function reorderCategories(ids: string[]) {
    try {
      await api.patch("/sidebar-categories/reorder", { categoryIds: ids });
    } catch {
      addToast({ title: "Error", description: "Failed to reorder categories", variant: "error" });
    }
  }

  async function moveCategoryUp(id: string) {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx]!, next[idx - 1]!];
      reorderCategories(next.map((c) => c.id));
      return next;
    });
  }

  async function moveCategoryDown(id: string) {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1]!, next[idx]!];
      reorderCategories(next.map((c) => c.id));
      return next;
    });
  }

  async function deleteCategory(id: string) {
    try {
      await api.delete(`/sidebar-categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch {
      addToast({ title: "Error", description: "Failed to delete category", variant: "error" });
    }
  }

  function handleCatDragStart(e: React.DragEvent, catId: string) {
    dragCatNode.current = e.target as HTMLElement;
    setDragCatId(catId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleCatDragOver(e: React.DragEvent, catId: string) {
    e.preventDefault();
    setDragCatOverId(catId);
  }

  function handleCatDragEnd() {
    if (!dragCatId || !dragCatOverId || dragCatId === dragCatOverId) {
      setDragCatId(null);
      setDragCatOverId(null);
      return;
    }
    const reordered = [...categories];
    const fromIdx = reordered.findIndex((c) => c.id === dragCatId);
    const toIdx = reordered.findIndex((c) => c.id === dragCatOverId);
    if (fromIdx === -1 || toIdx === -1) {
      setDragCatId(null);
      setDragCatOverId(null);
      return;
    }
    const [moved] = reordered.splice(fromIdx, 1);
    if (!moved) {
      setDragCatId(null);
      setDragCatOverId(null);
      return;
    }
    reordered.splice(toIdx, 0, moved);
    setCategories(reordered);
    setDragCatId(null);
    setDragCatOverId(null);
    const catIds = reordered.map((c) => c.id);
    api.patch("/sidebar-categories/reorder", { categoryIds: catIds }).catch(() => {
      addToast({ title: "Error", description: "Failed to reorder categories", variant: "error" });
    });
  }

  async function moveToCategory(channelId: string, categoryId: string) {
    try {
      await api.post(`/sidebar-categories/${categoryId}/assignments`, { channel_id: channelId });
      addToast({ title: "Moved to category", variant: "success", duration: 2000 });
    } catch {
      addToast({ title: "Error", description: "Failed to move channel", variant: "error" });
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

  // Close team menu on click outside
  useEffect(() => {
    if (!showTeamMenu) return;
    function handleClick(e: MouseEvent) {
      if (teamMenuRef.current && !teamMenuRef.current.contains(e.target as Node)) {
        setShowTeamMenu(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowTeamMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showTeamMenu]);

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

  // Socket unread updates
  useEffect(() => {
    let cancelled = false;
    import("@/lib/socket").then(({ getSocket }) => {
      if (cancelled) return;
      getSocket().then((s) => {
        if (cancelled) return;
        s.on(
          "unread:update",
          ({
            channelId: cId,
            count,
            mentions,
          }: {
            channelId: string;
            count: number;
            mentions: number;
          }) => {
            setUnreads((prev) => {
              const next = new Map(prev);
              if (count === 0 && mentions === 0) {
                next.delete(cId);
              } else {
                next.set(cId, { count, mentions });
              }
              return next;
            });
          },
        );
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div
        id="SidebarContainer"
        ref={setSidebarRef}
        className={`flex h-full flex-col ${collapsed ? "w-[60px]" : "w-full"}`}
        style={{
          background: "var(--sidebar-bg)",
          color: "var(--sidebar-text)",
          minWidth: collapsed ? 60 : 200,
          overflowX: "visible",
          position: "relative",
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
                setLocalCollapsed(false);
                onToggleCollapse?.(false);
              }}
              className="mx-auto flex h-9 w-9 items-center justify-center rounded"
              style={{ color: "var(--sidebar-header-text-color)" }}
              aria-label={t("sidebar.expand")}
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
                  aria-label={t(statusI18nKeys[userStatus.status] ?? "status.offline")}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="relative">
                  <button
                    onClick={() => setShowTeamMenu(!showTeamMenu)}
                    className="flex w-full items-center gap-1 truncate font-semibold"
                    style={{
                      fontSize: 14,
                      lineHeight: "18px",
                      color: "var(--sidebar-header-text-color)",
                    }}
                  >
                    <span className="truncate">
                      {workspace?.name ?? workspaceSlug ?? t("sidebar.appName")}
                    </span>
                    <ChevronDown size={10} className="shrink-0" />
                  </button>
                  <div
                    className="truncate text-xs"
                    style={{ color: "rgba(var(--sidebar-header-text-color-rgb), 0.8)" }}
                  >
                    {userStatus.custom_status ||
                      t(statusI18nKeys[userStatus.status] ?? "status.offline")}
                  </div>
                  {showTeamMenu && (
                    <div
                      ref={teamMenuRef}
                      className="absolute top-full left-0 z-50 mt-1 w-56 rounded-lg border py-1 shadow-[var(--elevation-4)]"
                      style={{
                        background: "var(--center-channel-bg)",
                        borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                      }}
                    >
                      {workspaces.map((w) => (
                        <Link
                          key={w.id}
                          href={`/${w.slug}`}
                          onClick={() => setShowTeamMenu(false)}
                          className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)] ${w.slug === workspaceSlug ? "font-semibold" : ""}`}
                          style={{ color: "var(--center-channel-color)" }}
                        >
                          <div
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                            style={{
                              background:
                                w.slug === workspaceSlug
                                  ? "var(--button-bg)"
                                  : "var(--text-tertiary)",
                            }}
                          >
                            {(w.name ?? "").charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate">{w.name}</span>
                          {w.slug === workspaceSlug && (
                            <span className="ml-auto text-xs" style={{ color: "var(--button-bg)" }}>
                              ✓
                            </span>
                          )}
                        </Link>
                      ))}
                      <div
                        className="my-1"
                        style={{
                          borderTop: "1px solid rgba(var(--center-channel-color-rgb), 0.08)",
                        }}
                      />
                      <button
                        onClick={() => setShowTeamMenu(false)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                        style={{ color: "var(--center-channel-color)" }}
                      >
                        <Plus size={14} />
                        {t("workspace.createWorkspace")}
                      </button>
                      <button
                        onClick={() => {
                          setShowInviteModal(true);
                          setShowTeamMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                        style={{ color: "var(--center-channel-color)" }}
                      >
                        <UserPlus size={14} />
                        {t("workspace.inviteMembers")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  userToggledRef.current = true;
                  setLocalCollapsed(true);
                  onToggleCollapse?.(true);
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
                style={{ color: "var(--sidebar-header-text-color)" }}
                aria-label={t("sidebar.collapse")}
              >
                <PanelLeftClose size={14} />
              </button>
            </>
          )}
        </div>

        {/* Channel Navigator (Jump to / search) */}
        {!collapsed && workspaceSlug && (
          <div className="px-3 py-2">
            <button
              className="flex h-9 w-full items-center gap-2 rounded px-2 text-sm"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.72)",
              }}
              onClick={() => {
                const event = new CustomEvent("chat:search-open");
                document.dispatchEvent(event);
              }}
              aria-label={t("sidebar.jumpToChannelOrUser")}
            >
              <Search size={14} />
              <span style={{ fontSize: 13 }}>{t("sidebar.jumpTo")}</span>
            </button>
            <button
              onClick={() => {
                if (workspace) setShowInviteModal(true);
              }}
              className="mt-1 flex h-9 w-full items-center gap-2 rounded px-2 text-sm"
              style={{
                color: "rgba(255,255,255,0.72)",
              }}
              aria-label={t("sidebar.inviteMembers")}
            >
              <UserPlus size={14} />
              <span style={{ fontSize: 13 }}>{t("sidebar.invitePeople")}</span>
            </button>
          </div>
        )}

        {/* Scrollable navigation area */}
        <div className="flex-1 overflow-y-auto py-1">
          {/* Workspaces section */}
          {!collapsed && (
            <div className="mb-2">
              <button
                onClick={() => setWsExpanded(!wsExpanded)}
                className="mm-sidebar-group-header w-full cursor-pointer"
              >
                <ChevronDown
                  size={12}
                  className="mr-1"
                  style={{
                    transform: wsExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                    transition: "transform 200ms",
                  }}
                />
                {t("workspace.title")}
              </button>
              {wsExpanded && (
                <>
                  <div key={refreshKey}>
                    <WorkspaceList activeSlug={workspaceSlug} />
                  </div>
                  <div className="mt-1 px-3">
                    <CreateWorkspaceDialog onCreated={handleCreated} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Category-driven channels */}
          {workspaceSlug && !collapsed && (
            <div className="mb-2">
              {categories.map((cat, index) => {
                const isDefault = cat.name === "Channels" || cat.name === "Direct Messages";
                const isExpanded = expandedCategories.has(cat.id);
                return (
                  <div key={cat.id} className="mb-1">
                    <div
                      className="mm-sidebar-group-header group flex w-full items-center gap-1"
                      draggable
                      onDragStart={(e) => handleCatDragStart(e, cat.id)}
                      onDragOver={(e) => handleCatDragOver(e, cat.id)}
                      onDragEnd={handleCatDragEnd}
                      style={{
                        opacity: dragCatId === cat.id ? 0.5 : 1,
                        borderTop:
                          dragCatOverId === cat.id
                            ? "2px solid var(--sidebar-text-active-border)"
                            : "2px solid transparent",
                      }}
                    >
                      <button
                        onClick={() => {
                          const next = new Set(expandedCategories);
                          if (isExpanded) next.delete(cat.id);
                          else next.add(cat.id);
                          setExpandedCategories(next);
                        }}
                        className="flex cursor-pointer items-center gap-1"
                      >
                        <ChevronDown
                          size={12}
                          style={{
                            transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                            transition: "transform 200ms",
                          }}
                        />
                      </button>
                      {renamingCategory === cat.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            renameCategory(cat.id, renameValue);
                          }}
                          className="flex flex-1 items-center gap-1"
                        >
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => setRenamingCategory(null)}
                            className="flex-1 rounded px-1 py-0.5 text-xs"
                            style={{
                              background: "rgba(255,255,255,0.1)",
                              color: "var(--button-color)",
                              border: "none",
                              outline: "none",
                            }}
                            aria-label="Category name"
                          />
                        </form>
                      ) : (
                        <span
                          className="flex-1 cursor-pointer text-xs font-semibold tracking-wider uppercase"
                          onDoubleClick={() => {
                            setRenamingCategory(cat.id);
                            setRenameValue(cat.name);
                          }}
                        >
                          {cat.name}
                        </span>
                      )}
                      {!isDefault && (
                        <>
                          <button
                            onClick={() => moveCategoryUp(cat.id)}
                            className="mr-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-[rgba(255,255,255,0.1)] focus-visible:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={t("sidebar.moveUp", { name: cat.name })}
                            disabled={index === 0}
                          >
                            <ChevronUp size={8} style={{ color: "rgba(255,255,255,0.5)" }} />
                          </button>
                          <button
                            onClick={() => moveCategoryDown(cat.id)}
                            className="mr-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-[rgba(255,255,255,0.1)] focus-visible:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={t("sidebar.moveDown", { name: cat.name })}
                            title="Move down"
                            disabled={index === categories.length - 1}
                          >
                            <ChevronDown size={8} style={{ color: "rgba(255,255,255,0.5)" }} />
                          </button>
                          <button
                            onClick={() => {
                              setRenamingCategory(cat.id);
                              setRenameValue(cat.name);
                            }}
                            className="mr-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-[rgba(255,255,255,0.1)] focus-visible:opacity-100"
                            aria-label={t("sidebar.rename", { name: cat.name })}
                            title="Rename"
                          >
                            <Pencil size={8} style={{ color: "rgba(255,255,255,0.5)" }} />
                          </button>
                          <button
                            onClick={() => deleteCategory(cat.id)}
                            className="mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-[rgba(255,255,255,0.1)] focus-visible:opacity-100"
                            aria-label={t("sidebar.deleteCategory", { name: cat.name })}
                          >
                            <X size={10} style={{ color: "rgba(255,255,255,0.5)" }} />
                          </button>
                        </>
                      )}
                    </div>
                    {isExpanded && (
                      <>
                        {cat.name === "Channels" && (
                          <>
                            <div className="flex items-center justify-end px-5 py-0.5">
                              <button
                                onClick={() => setShowUnreads(!showUnreads)}
                                className="rounded px-2 py-0.5 text-[10px] font-medium uppercase transition-colors"
                                style={{
                                  color: showUnreads
                                    ? "var(--sidebar-text-active-color)"
                                    : "rgba(255,255,255,0.5)",
                                  background: showUnreads
                                    ? "rgba(255,255,255,0.15)"
                                    : "transparent",
                                }}
                                aria-label={
                                  showUnreads
                                    ? t("sidebar.showAllChannels")
                                    : t("sidebar.showUnreadOnly")
                                }
                              >
                                {showUnreads ? t("common.all") : t("sidebar.unreads")}
                              </button>
                            </div>
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
                                  showUnreads={showUnreads}
                                  unreadChannels={unreadChannelIds}
                                  unreads={unreads}
                                  categories={categories}
                                  onMoveToCategory={moveToCategory}
                                />
                              </div>
                            )}
                            {workspace && (
                              <div className="mt-1 px-3">
                                <CreateChannelDialog
                                  workspaceId={workspace.id}
                                  onCreated={handleChannelCreated}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              {/* Add category */}
              {creatingCategory ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createCategory();
                  }}
                  className="flex items-center gap-1 px-4 py-1"
                >
                  <input
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onBlur={() => {
                      setCreatingCategory(false);
                      setNewCategoryName("");
                    }}
                    placeholder={t("sidebar.categoryName")}
                    className="flex-1 rounded px-2 py-1 text-xs"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "var(--button-color)",
                      border: "none",
                      outline: "none",
                    }}
                    aria-label={t("sidebar.newCategoryName")}
                  />
                </form>
              ) : (
                <button
                  onClick={() => setCreatingCategory(true)}
                  className="flex w-full items-center gap-1 rounded px-5 py-1 text-xs transition-colors hover:bg-[rgba(255,255,255,0.08)]"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  aria-label="Add category"
                >
                  <Plus size={12} />
                  {t("sidebar.addCategory")}
                </button>
              )}
            </div>
          )}

          {/* Saved Messages + Scheduled */}
          {workspaceSlug && !collapsed && (
            <div className="mb-2">
              <div className="mm-sidebar-group-header">{t("sidebar.saved")}</div>
              <Link
                href={`/${workspaceSlug}/saved`}
                className="flex items-center gap-2 rounded-md px-5 py-1.5 text-sm transition-colors"
                style={{
                  color: "var(--sidebar-text)",
                  opacity: 0.8,
                }}
              >
                <Bookmark size={14} />
                <span>{t("sidebar.savedMessages")}</span>
              </Link>
              <Link
                href={`/${workspaceSlug}/scheduled`}
                className="flex items-center gap-2 rounded-md px-5 py-1.5 text-sm transition-colors"
                style={{
                  color: "var(--sidebar-text)",
                  opacity: 0.8,
                }}
              >
                <Clock size={14} />
                <span>{t("sidebar.scheduledMessages")}</span>
              </Link>
              <Link
                href={`/${workspaceSlug}/groups`}
                className="flex items-center gap-2 rounded-md px-5 py-1.5 text-sm transition-colors"
                style={{
                  color: "var(--sidebar-text)",
                  opacity: 0.8,
                }}
              >
                <Users size={14} />
                <span>{t("sidebar.userGroups")}</span>
              </Link>
              <Link
                href={`/${workspaceSlug}/threads`}
                className="flex items-center gap-2 rounded-md px-5 py-1.5 text-sm transition-colors"
                style={{
                  color: "var(--sidebar-text)",
                  opacity: 0.8,
                }}
              >
                <MessageSquare size={14} />
                <span>{t("sidebar.threads")}</span>
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
                {t("sidebar.directMessages")}
              </button>
              {dmExpanded && (
                <>
                  {dmChannels.length > 0 ? (
                    <ul role="listbox" aria-label="Direct messages">
                      {dmChannels.map((ch) => {
                        const isGroup = ch.channel_type === "group";
                        const displayName = isGroup
                          ? ch.name.replace(/^(gm-)?/, "")
                          : (ch.otherMembers?.[0]?.display_name ??
                            ch.otherMembers?.[0]?.user_id?.slice(0, 8) ??
                            ch.name);
                        const otherUserId = ch.otherMembers?.[0]?.user_id;
                        const status = otherUserId ? getStatus(otherUserId) : "offline";
                        return (
                          <li key={ch.id} role="option" aria-selected={channelId === ch.id}>
                            <Link
                              href={`/${workspaceSlug}/${ch.slug}`}
                              className="mm-sidebar-channel rounded-md px-5 text-sm transition-colors"
                              style={{
                                color:
                                  channelId === ch.id
                                    ? "var(--sidebar-text-active-color)"
                                    : "var(--sidebar-text)",
                                background:
                                  channelId === ch.id ? "rgba(255,255,255,0.12)" : "transparent",
                                fontWeight: channelId === ch.id ? 600 : 400,
                              }}
                            >
                              <span className="mr-2 inline-flex items-center gap-1">
                                {!isGroup && otherUserId && (
                                  <span
                                    className={`status-pill ${statusClass(status)}`}
                                    style={{ background: presenceColor(status) }}
                                    aria-label={`Status: ${status}`}
                                    role="status"
                                  />
                                )}
                                {displayName}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="px-5 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {t("sidebar.noDMs")}
                    </p>
                  )}
                  <button
                    onClick={() => setShowUserPicker(true)}
                    className="flex w-full items-center gap-2 rounded px-5 py-1.5 text-sm"
                    style={{ color: "rgba(255,255,255,0.72)" }}
                  >
                    <Plus size={14} />
                    <span>{t("sidebar.newDM")}</span>
                  </button>
                </>
              )}
            </div>
          )}

          {showUserPicker && (
            <UserPickerModal
              users={chatUsers}
              selectedIds={selectedUserIds}
              onToggle={toggleUserSelection}
              onCancel={() => {
                setShowUserPicker(false);
                setSelectedUserIds(new Set());
              }}
              onSubmit={createGroupChat}
              submitLabel={
                selectedUserIds.size === 0
                  ? t("sidebar.selectUsersToStart")
                  : selectedUserIds.size === 1
                    ? t("sidebar.startDM")
                    : t("sidebar.startGroupChat", { count: selectedUserIds.size })
              }
              submitDisabled={selectedUserIds.size === 0}
              title={t("sidebar.startConversation")}
              description={t("sidebar.selectUsersDesc")}
            />
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
              { key: "online", label: t("status.online"), color: "#06d6a0" },
              { key: "away", label: t("status.away"), color: "#ffbc42" },
              { key: "dnd", label: t("status.doNotDisturb"), color: "#d24b4e" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setStatus(s.key)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm`}
                style={{
                  color: "var(--center-channel-color)",
                  background:
                    userStatus.status === s.key
                      ? "rgba(var(--center-channel-color-rgb), 0.08)"
                      : "transparent",
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
                {t("sidebar.appName")}
              </Link>
              <span className="ml-auto flex gap-1">
                <button
                  onClick={signOut}
                  className="hover:opacity-80"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {t("auth.logout")}
                </button>
                <button
                  onClick={() => {
                    document.dispatchEvent(new CustomEvent("chat:open-shortcuts"));
                  }}
                  className="hover:opacity-80"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                  aria-label="Keyboard shortcuts"
                >
                  ?
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
                {workspaceSlug && (
                  <Link
                    href={`/${workspaceSlug}/admin`}
                    className="hover:opacity-80"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    <Shield size={14} />
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
