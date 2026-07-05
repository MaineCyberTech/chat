"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { QuickSwitcher } from "@/components/chat/quick-switcher";
import { useSwipeBack } from "@/lib/use-swipe-back";
import { api } from "@/lib/api";
import { register } from "@/lib/keyboard-shortcut-registry";
import { Menu, Hash, Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import type { Workspace, Channel } from "@chat/db";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ workspaceSlug?: string; channelId?: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [channels, setChannels] = useState<string[]>([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      resizingRef.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = sidebarWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [sidebarWidth],
  );

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!resizingRef.current) return;
      const newWidth = Math.max(
        200,
        Math.min(500, startWidthRef.current + (e.clientX - startXRef.current)),
      );
      setSidebarWidth(newWidth);
    }
    function onMouseUp() {
      if (resizingRef.current) {
        resizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        try {
          localStorage.setItem("sidebar_width", String(sidebarWidth));
        } catch {
          /* ignore */
        }
      }
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [sidebarWidth]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_width");
      if (saved) setSidebarWidth(parseInt(saved, 10));
    } catch {
      /* ignore */
    }
  }, []);

  useSwipeBack(() => {
    if (params.channelId && params.workspaceSlug) {
      router.push(`/${params.workspaceSlug}`);
    }
  });

  useEffect(() => {
    if (!user || !params.workspaceSlug) return;
    api
      .get<{ workspaces: Workspace[] }>("/workspaces")
      .then((res) => {
        const ws = res.workspaces.find((w) => w.slug === params.workspaceSlug);
        if (!ws) return;
        api
          .get<{ channels: Channel[] }>(`/workspaces/${ws.id}/channels`)
          .then((res) => setChannels(res.channels.map((c) => c.slug)))
          .catch(() => console.warn("Failed to fetch channels for keyboard nav"));
      })
      .catch(() => console.warn("Failed to fetch workspace for keyboard nav"));
  }, [user, params.workspaceSlug]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSwitcherOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!params.workspaceSlug) return;
    register("channelUp", () => {
      const current = params.channelId;
      if (!current || channels.length === 0) return;
      const idx = channels.indexOf(current);
      if (idx > 0) {
        router.push(`/${params.workspaceSlug}/${channels[idx - 1]}`);
      }
    });
    register("channelDown", () => {
      const current = params.channelId;
      if (!current || channels.length === 0) return;
      const idx = channels.indexOf(current);
      if (idx < channels.length - 1) {
        router.push(`/${params.workspaceSlug}/${channels[idx + 1]}`);
      }
    });
    register("searchOpen", () => {
      const event = new CustomEvent("chat:search-open");
      document.dispatchEvent(event);
    });
    return () => {
      register("channelUp", null);
      register("channelDown", null);
      register("searchOpen", null);
    };
  }, [params.workspaceSlug, params.channelId, channels, router]);

  if (authLoading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: "var(--center-channel-bg)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2"
            style={{ borderColor: "var(--border-default)", borderTopColor: "var(--button-bg)" }}
          />
          <p className="text-sm" style={{ color: "var(--center-channel-color)", opacity: 0.72 }}>
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className="app__body"
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Grid root - Mattermost style */}
      <div id="root" className="channel-view" style={{ flex: 1, minHeight: 0 }}>
        {/* Mobile header */}
        <div
          id="global-header"
          className="flex items-center gap-2 px-3 py-2 md:hidden"
          style={{
            background: "var(--sidebar-header-bg)",
            color: "var(--sidebar-header-text-color)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded"
            style={{ background: "transparent", color: "var(--sidebar-header-text-color)" }}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <span className="truncate text-sm font-semibold">{params.workspaceSlug ?? "Chat"}</span>
        </div>

        {/* Main content area */}
        <div style={{ display: "flex", width: sidebarWidth, minWidth: 200, position: "relative" }}>
          <div style={{ width: "100%", overflow: "hidden" }}>
            <AppSidebar
              workspaceSlug={params.workspaceSlug}
              channelId={params.channelId}
              mobileOpen={sidebarOpen}
              onMobileClose={() => setSidebarOpen(false)}
            />
          </div>
          <div
            onMouseDown={handleMouseDown}
            className="hidden md:block"
            style={{
              width: 4,
              cursor: "col-resize",
              background: "transparent",
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              zIndex: 10,
              transition: "background 150ms",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(var(--center-channel-color-rgb), 0.16)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            aria-label="Resize sidebar"
          />
        </div>

        <div className="app__content">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>

        {/* Mobile bottom navigation */}
        <nav
          className="flex shrink-0 items-center justify-around md:hidden"
          style={{
            height: "var(--bottom-nav-height)",
            borderTop: "var(--border-default)",
            background: "var(--center-channel-bg)",
            gridColumn: "1 / -1",
          }}
        >
          {params.channelId && params.workspaceSlug && (
            <button
              onClick={() => router.push(`/${params.workspaceSlug}`)}
              className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-3 text-xs"
              style={{ color: "var(--center-channel-color)", opacity: 0.72 }}
              aria-label="Back"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
          )}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-3 text-xs"
            style={{ color: "var(--center-channel-color)", opacity: 0.72 }}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
            <span>Menu</span>
          </button>
          <Link
            href={params.workspaceSlug ? `/${params.workspaceSlug}` : "/"}
            className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-3 text-xs"
            style={{ color: "var(--center-channel-color)", opacity: 0.72 }}
          >
            <Hash size={20} />
            <span>Channels</span>
          </Link>
          <Link
            href={params.workspaceSlug ? `/${params.workspaceSlug}/settings` : "/"}
            className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-3 text-xs"
            style={{ color: "var(--center-channel-color)", opacity: 0.72 }}
          >
            <SettingsIcon size={20} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {params.workspaceSlug && (
        <QuickSwitcher
          workspaceSlug={params.workspaceSlug}
          open={switcherOpen}
          onClose={() => setSwitcherOpen(false)}
        />
      )}
    </div>
  );
}
