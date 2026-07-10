"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { TeamSidebar } from "@/components/workspace/team-sidebar";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { QuickSwitcher } from "@/components/chat/quick-switcher";
import { OnboardingTour } from "@/components/workspace/onboarding-tour";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { useSwipeBack } from "@/lib/use-swipe-back";
import { api } from "@/lib/api";
import { register } from "@/lib/keyboard-shortcut-registry";
import { Menu, Hash, Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import type { Workspace, Channel } from "@chat/db";

function RouteLoadingIndicator() {
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (pathname !== prevPathname) {
      setPrevPathname(pathname);
      setShowLoader(true);
      const timer = setTimeout(() => setShowLoader(false), 600);
      return () => clearTimeout(timer);
    }
  }, [pathname, prevPathname]);

  return (
    <div
      className="fixed top-0 right-0 left-0 z-50 h-0.5"
      style={{ opacity: showLoader ? 1 : 0, transition: "opacity 200ms" }}
    >
      <div
        className="h-full"
        style={{
          background: "var(--button-bg)",
          width: showLoader ? "100%" : "0%",
          transition: showLoader ? "width 30s ease-out" : "width 200ms ease-in",
        }}
      />
    </div>
  );
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ workspaceSlug?: string; channelId?: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [channels, setChannels] = useState<string[]>([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const handleResizeKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 20 : 5;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSidebarWidth((w) => Math.max(200, w - step));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSidebarWidth((w) => Math.min(500, w + step));
    }
  }, []);

  const sidebarWidthRef = useRef(sidebarWidth);
  sidebarWidthRef.current = sidebarWidth;

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
          localStorage.setItem("sidebar_width", String(sidebarWidthRef.current));
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
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_width");
      if (saved) setSidebarWidth(parseInt(saved, 10));
    } catch {
      /* ignore */
    }
  }, []);

  // Auto-collapse sidebar on tablet (768-1024px)
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      setSidebarCollapsed(w >= 768 && w < 1024);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
    register("channelSearch", () => {
      const event = new CustomEvent("chat:search-open");
      document.dispatchEvent(event);
    });
    return () => {
      register("channelUp", null);
      register("channelDown", null);
      register("searchOpen", null);
      register("channelSearch", null);
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

  useEffect(() => {
    if (!user && !authLoading) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, authLoading, router, pathname]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--center-channel-bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div
      className="app__body"
      style={{
        flex: 1,
        display: "grid",
        gridTemplateRows: "1fr",
        background: "var(--sidebar-bg)",
        minHeight: 0,
      }}
    >
      <RouteLoadingIndicator />

      <AnnouncementBanner />

      {/* Flex row for sidebar + content */}
      <div style={{ display: "flex", overflow: "clip", minHeight: 0 }}>
        {/* Mobile header */}
        <div
          id="global-header"
          className="flex items-center gap-2 px-3 md:hidden"
          style={{
            background: "var(--sidebar-header-bg)",
            color: "var(--sidebar-header-text-color)",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            paddingTop: "env(safe-area-inset-top, 0px)",
            height: "calc(3rem + env(safe-area-inset-top, 0px))",
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

        {/* Team sidebar rail (desktop only) */}
        <div className="hidden md:block" style={{ flexShrink: 0 }}>
          <TeamSidebar />
        </div>

        {/* Sidebar (desktop/tablet) */}
        <div
          className="hidden md:flex"
          style={{
            width: sidebarCollapsed ? 60 : sidebarWidth,
            minWidth: sidebarCollapsed ? 60 : 200,
            position: "relative",
            flexShrink: 0,
            transition: "width 200ms",
          }}
        >
          <div style={{ width: "100%", overflow: "clip auto" }}>
            <AppSidebar
              workspaceSlug={params.workspaceSlug}
              channelId={params.channelId}
              mobileOpen={sidebarOpen}
              onMobileClose={() => setSidebarOpen(false)}
              collapsed={sidebarCollapsed}
              onToggleCollapse={setSidebarCollapsed}
            />
          </div>
          {!sidebarCollapsed && (
            <div
              onMouseDown={handleMouseDown}
              onKeyDown={handleResizeKeyDown}
              className="hidden md:block"
              style={{
                width: 12,
                cursor: "col-resize",
                background: "transparent",
                position: "absolute",
                right: -12,
                top: 0,
                bottom: 0,
                zIndex: 50,
                transition: "background 150ms",
              }}
              tabIndex={0}
              role="separator"
              aria-label="Resize sidebar. Use arrow keys to resize."
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(var(--center-channel-color-rgb), 0.16)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            />
          )}
        </div>

        {/* Main content */}
        <div
          className="app__content"
          style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}
        >
          <ErrorBoundary>{children}</ErrorBoundary>
          <div className="md:hidden" style={{ height: "var(--bottom-nav-height)" }} />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              style={{
                width: "80vw",
                maxWidth: 320,
                height: "100%",
                background: "var(--sidebar-bg)",
              }}
            >
              <AppSidebar
                workspaceSlug={params.workspaceSlug}
                channelId={params.channelId}
                mobileOpen={sidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Mobile bottom navigation */}
        <nav
          className="flex shrink-0 items-center justify-around md:hidden"
          style={{
            height: "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            borderTop: "var(--border-default)",
            background: "var(--center-channel-bg)",
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
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

      <OnboardingTour />
    </div>
  );
}
