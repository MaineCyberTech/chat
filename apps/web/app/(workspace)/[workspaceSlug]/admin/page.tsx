"use client";
export const dynamic = "force-dynamic";

import React, { Component, useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { EmptyState, Skeleton, useToast } from "@chat/ui";
import { t } from "@/lib/i18n";
import { PaginationBar } from "@/components/shared/pagination-bar";

import {
  Shield,
  Users,
  Hash,
  MessageSquare,
  Globe,
  Webhook,
  Search,
  X,
  Download,
  Upload,
  Activity,
  Lock,
  FileText,
  Settings,
  Server,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
} from "lucide-react";

interface Stats {
  users: number;
  workspaces: number;
  channels: number;
  messages: number;
}
interface AuthUser {
  id: string;
  email: string;
  display_name?: string;
  created_at: string;
}
interface AdminChannel {
  id: string;
  name: string;
  slug: string;
  is_private: boolean;
  created_at: string;
  workspaces: { name: string; slug: string };
}
interface AdminWorkspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  workspace_members: { count: number }[];
}
interface AdminIntegration {
  id: string;
  name: string;
  url: string;
  created_at: string;
  workspaces: { name: string; slug: string };
}
interface SecurityInfo {
  authProviders: Record<string, { enabled: boolean; label: string }>;
  rateLimiters: { name: string; limit: number; windowMs: number; unit: string }[];
  securityHeaders: { name: string; status: string }[];
  sessionConfig: { jwtEnabled: boolean; sessionDuration: string; refreshTokenRotation: boolean };
}
interface AuditLogEntry {
  id: string;
  organization_id: string | null;
  actor_user_id: string | null;
  actor_type: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  auth_users?: { email: string } | null;
}
interface HealthInfo {
  service: string;
  status: string;
  uptime: number;
  checks: Record<
    string,
    { status: string; latencyMs?: number; message?: string; queueCounts?: Record<string, number> }
  >;
}
interface SystemInfo {
  version: string;
  environment: string;
  uptime_seconds: number;
  database: string;
  db_latency_ms?: number;
  timestamp: string;
}
interface SiteConfig {
  appName: string;
  version: string;
  environment: string;
  frontendUrl: string;
  apiUrl: string;
  supabaseProjectRef: string | null;
  redisConfigured: boolean;
  smtpConfigured: boolean;
  sentryConfigured: boolean;
  vapidConfigured: boolean;
}
interface LogEntry {
  level: string;
  message: string;
  requestId?: string;
  path?: string;
  code?: string;
  statusCode?: number;
  timestamp: string;
}

type Tab =
  | "overview"
  | "users"
  | "channels"
  | "workspaces"
  | "integrations"
  | "import-export"
  | "security"
  | "audit-log"
  | "system"
  | "site-config"
  | "logs";

interface SidebarSection {
  label: string;
  items: { id: Tab; label: string; icon: React.ReactNode }[];
}

/* Admin-specific status indicator (distinct from @chat/ui StatusBadge which is for user presence) */
function StatusBadge({ status }: { status: string }) {
  const color =
    status === "healthy" || status === "enabled" || status === "connected"
      ? "var(--online-indicator)"
      : status === "degraded" || status === "warn"
        ? "var(--away-indicator)"
        : "var(--dnd-indicator)";
  const Icon =
    status === "healthy" || status === "enabled" || status === "connected"
      ? CheckCircle
      : status === "degraded" || status === "warn"
        ? AlertTriangle
        : XCircle;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color }}>
      <Icon size={12} />
      {status}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg border p-4 ${className}`}
      style={{
        borderColor: "rgba(var(--center-channel-color-rgb), 0.12)",
        background: "var(--center-channel-bg)",
      }}
    >
      {children}
    </div>
  );
}

class TabErrorBoundary extends Component<
  { children: React.ReactNode; tabName: string },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <p className="p-4 text-sm" style={{ color: "var(--error-text, var(--dnd-indicator))" }}>
          {t("admin.failedToLoadTab", { name: this.props.tabName })}
        </p>
      );
    }
    return this.props.children;
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export default function AdminPage() {
  const params = useParams<{ workspaceSlug?: string }>();
  useEffect(() => {
    document.title = `${t("admin.title", "Admin")} - ${params.workspaceSlug || "Chat"}`;
  }, [params.workspaceSlug]);
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [integrations, setIntegrations] = useState<AdminIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(0);
  const [userTotal, setUserTotal] = useState(0);
  const [channelPage, setChannelPage] = useState(0);
  const [channelTotal, setChannelTotal] = useState(0);

  const [security, setSecurity] = useState<SecurityInfo | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(0);
  const [auditFilter, setAuditFilter] = useState({ action: "", dateFrom: "", dateTo: "" });
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logLevel, setLogLevel] = useState<string>("");
  const { addToast } = useToast();

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importEndpoint, setImportEndpoint] = useState<"workspaces" | "users">("workspaces");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors?: string[] } | null>(
    null,
  );
  const [csvPreview, setCsvPreview] = useState<string[][] | null>(null);
  const [showCsvConfirm, setShowCsvConfirm] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [exporting, setExporting] = useState<string | null>(null);

  async function downloadExport(path: string) {
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${API_BASE}/v1${path}?format=${exportFormat}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename = disposition.match(/filename="?(.+?)"?$/)?.[1] ?? `export.${exportFormat}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.exportFailed", "Export failed"));
    }
  }

  async function handleFileSelect(file: File | null) {
    setImportFile(file);
    setCsvPreview(null);
    setShowCsvConfirm(false);
    setImportResult(null);
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(Boolean);
      const rows = lines.slice(0, 6).map((l) => parseCSVLine(l));
      setCsvPreview(rows);
    } catch {
      /* ignore */
    }
  }

  async function handleImport() {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    setError(null);
    try {
      const text = await importFile.text();
      const res = await api.post<{ imported: number; errors?: string[] }>(
        `/admin/import/${importEndpoint}`,
        { csv: text },
      );
      setImportResult(res);
      setShowCsvConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.importFailed", "Import failed"));
    }
    setImporting(false);
  }

  async function handleUserRoleChange(userId: string, role: string) {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      addToast({
        title: t("admin.roleChanged", "Role updated"),
        variant: "success",
        duration: 3000,
      });
    } catch {
      addToast({
        title: t("common.error", "Error"),
        description: t("admin.roleChangeFailed", "Failed to update role"),
        variant: "error",
      });
    }
  }

  const fetchTab = useCallback(
    async (tabParam: Tab) => {
      setError(null);
      setLoading(true);
      try {
        if (tabParam === "overview") {
          const res = await api.get<{ stats: Stats }>("/admin/stats");
          setStats(res.stats);
        } else if (tabParam === "users") {
          const res = await api.get<{ users: AuthUser[]; total: number }>(
            `/admin/users?search=${encodeURIComponent(userSearch)}&page=${userPage}`,
          );
          setUsers(res.users);
          setUserTotal(res.total);
        } else if (tabParam === "channels") {
          const res = await api.get<{ channels: AdminChannel[]; total: number }>(
            `/admin/channels?page=${channelPage}`,
          );
          setChannels(res.channels);
          setChannelTotal(res.total);
        } else if (tabParam === "workspaces") {
          const res = await api.get<{ workspaces: AdminWorkspace[] }>("/admin/workspaces");
          setWorkspaces(res.workspaces);
        } else if (tabParam === "integrations") {
          const res = await api.get<{ integrations: AdminIntegration[] }>("/admin/integrations");
          setIntegrations(res.integrations);
        } else if (tabParam === "security") {
          const res = await api.get<SecurityInfo>("/admin/security");
          setSecurity(res);
        } else if (tabParam === "audit-log") {
          const params = new URLSearchParams({ page: String(auditPage), limit: "50" });
          if (auditFilter.action) params.set("action", auditFilter.action);
          if (auditFilter.dateFrom) params.set("dateFrom", auditFilter.dateFrom);
          if (auditFilter.dateTo) params.set("dateTo", auditFilter.dateTo);
          const res = await api.get<{ logs: AuditLogEntry[]; total: number }>(
            `/admin/audit-logs?${params.toString()}`,
          );
          setAuditLogs(res.logs);
          setAuditTotal(res.total);
        } else if (tabParam === "system") {
          const [hRes, sRes] = await Promise.all([
            api.get<HealthInfo>("/admin/health"),
            api.get<SystemInfo>("/admin/system"),
          ]);
          setHealth(hRes);
          setSystem(sRes);
        } else if (tabParam === "site-config") {
          const res = await api.get<SiteConfig>("/admin/config");
          setSiteConfig(res);
        } else if (tabParam === "logs") {
          const params = new URLSearchParams({ limit: "200" });
          if (logLevel) params.set("level", logLevel);
          const res = await api.get<{ logs: LogEntry[] }>(`/admin/logs?${params.toString()}`);
          setLogs(res.logs);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : t("admin.failedToLoad", "Failed to load"));
      }
      setLoading(false);
    },
    [userSearch, userPage, channelPage, auditPage, auditFilter, logLevel],
  );

  useEffect(() => {
    fetchTab(tab);
  }, [tab, fetchTab]);
  useEffect(() => {
    if (tab === "users") {
      setUserPage(0);
      fetchTab("users");
    }
  }, [userSearch]);
  useEffect(() => {
    if (tab === "users") fetchTab("users");
  }, [userPage]);
  useEffect(() => {
    if (tab === "channels") fetchTab("channels");
  }, [channelPage]);
  useEffect(() => {
    if (tab === "audit-log") fetchTab("audit-log");
  }, [auditPage, auditFilter]);

  const sidebarSections: SidebarSection[] = [
    {
      label: t("admin.systemSettings", "System Settings"),
      items: [
        { id: "overview", label: t("admin.overview", "Overview"), icon: <Shield size={16} /> },
        { id: "security", label: t("admin.security", "Security"), icon: <Lock size={16} /> },
        {
          id: "site-config",
          label: t("admin.siteConfig", "Site Configuration"),
          icon: <Settings size={16} />,
        },
      ],
    },
    {
      label: t("admin.userManagement", "User Management"),
      items: [
        { id: "users", label: t("admin.users", "Users"), icon: <Users size={16} /> },
        { id: "channels", label: t("admin.channels", "Channels"), icon: <Hash size={16} /> },
        { id: "workspaces", label: t("admin.workspaces", "Workspaces"), icon: <Globe size={16} /> },
      ],
    },
    {
      label: t("admin.integrations", "Integrations"),
      items: [
        { id: "integrations", label: t("admin.webhooks", "Webhooks"), icon: <Webhook size={16} /> },
      ],
    },
    {
      label: t("admin.compliance", "Compliance"),
      items: [
        { id: "audit-log", label: t("admin.auditLog", "Audit Log"), icon: <FileText size={16} /> },
        {
          id: "import-export",
          label: t("admin.importExport", "Import / Export"),
          icon: <Download size={16} />,
        },
      ],
    },
    {
      label: t("admin.troubleshooting", "Troubleshooting"),
      items: [
        { id: "system", label: t("admin.system", "System Info"), icon: <Server size={16} /> },
        { id: "logs", label: t("admin.logs", "Logs"), icon: <Activity size={16} /> },
      ],
    },
  ];

  const tabLabel = sidebarSections.flatMap((s) => s.items).find((i) => i.id === tab)?.label ?? tab;

  function renderContent() {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-lg border p-4"
              style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
            >
              <Skeleton className="mb-2 h-6 w-6" />
              <Skeleton className="mb-2 h-8 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="mb-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              fetchTab(tab);
            }}
            className="rounded-md px-4 py-2 text-xs font-medium text-white"
            style={{ background: "var(--button-bg)" }}
          >
            {t("common.retry", "Retry")}
          </button>
        </div>
      );
    }

    switch (tab) {
      case "overview":
        return <TabErrorBoundary tabName="overview">{renderOverview()}</TabErrorBoundary>;
      case "users":
        return <TabErrorBoundary tabName="users">{renderUsers()}</TabErrorBoundary>;
      case "channels":
        return <TabErrorBoundary tabName="channels">{renderChannels()}</TabErrorBoundary>;
      case "workspaces":
        return <TabErrorBoundary tabName="workspaces">{renderWorkspaces()}</TabErrorBoundary>;
      case "integrations":
        return <TabErrorBoundary tabName="integrations">{renderIntegrations()}</TabErrorBoundary>;
      case "import-export":
        return <TabErrorBoundary tabName="import-export">{renderImportExport()}</TabErrorBoundary>;
      case "security":
        return <TabErrorBoundary tabName="security">{renderSecurity()}</TabErrorBoundary>;
      case "audit-log":
        return <TabErrorBoundary tabName="audit-log">{renderAuditLog()}</TabErrorBoundary>;
      case "system":
        return <TabErrorBoundary tabName="system">{renderSystem()}</TabErrorBoundary>;
      case "site-config":
        return <TabErrorBoundary tabName="site-config">{renderSiteConfig()}</TabErrorBoundary>;
      case "logs":
        return <TabErrorBoundary tabName="logs">{renderLogs()}</TabErrorBoundary>;
      default:
        return null;
    }
  }

  function renderOverview() {
    if (!stats) return null;
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[
          {
            label: t("admin.users", "Users"),
            value: stats.users,
            icon: <Users size={24} />,
            color: "var(--button-bg)",
          },
          {
            label: t("admin.workspaces", "Workspaces"),
            value: stats.workspaces,
            icon: <Globe size={24} />,
            color: "var(--online-indicator)",
          },
          {
            label: t("admin.channels", "Channels"),
            value: stats.channels,
            icon: <Hash size={24} />,
            color: "var(--away-indicator)",
          },
          {
            label: t("admin.messages", "Messages"),
            value: stats.messages,
            icon: <MessageSquare size={24} />,
            color: "var(--dnd-indicator)",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border p-4"
            style={{
              borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
              background: "var(--center-channel-bg)",
            }}
          >
            <div className="mb-2" style={{ color: card.color }}>
              {card.icon}
            </div>
            <div className="text-2xl font-bold" style={{ color: "var(--center-channel-color)" }}>
              {card.value?.toLocaleString() ?? "-"}
            </div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderUsers() {
    return (
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute top-1/2 left-3 -translate-y-1/2"
              style={{ color: "var(--text-tertiary)" }}
            />
            <input
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(0);
              }}
              placeholder={t("admin.searchUsers", "Search users...")}
              className="w-full rounded-lg border px-8 py-2 text-sm focus:outline-none"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
            />
            {userSearch && (
              <button
                onClick={() => setUserSearch("")}
                className="absolute top-1/2 right-3 -translate-y-1/2"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-lg border p-3"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "var(--button-bg)", color: "var(--button-color)" }}
              >
                {(u.display_name ?? u.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--center-channel-color)" }}
                >
                  {u.display_name || u.email.split("@")[0]}
                </div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {u.email} &middot; {t("admin.joined", "Joined")}{" "}
                  {new Date(u.created_at).toLocaleDateString()}
                </div>
              </div>
              <select
                defaultValue="member"
                onChange={(e) => handleUserRoleChange(u.id, e.target.value)}
                className="rounded border px-2 py-1 text-xs focus:outline-none"
                style={{
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  color: "var(--center-channel-color)",
                  background: "var(--center-channel-bg)",
                }}
                aria-label={t("admin.roleFor", { name: u.display_name ?? u.email })}
              >
                <option value="member">{t("admin.roleMember", "Member")}</option>
                <option value="admin">{t("admin.roleAdmin", "Admin")}</option>
                <option value="owner">{t("admin.roleOwner", "Owner")}</option>
              </select>
            </div>
          ))}
        </div>
        {userTotal > 20 && (
          <PaginationBar
            currentPage={userPage + 1}
            totalPages={Math.ceil(userTotal / 20)}
            onPrev={() => setUserPage((p) => p - 1)}
            onNext={() => setUserPage((p) => p + 1)}
          />
        )}
      </div>
    );
  }

  function renderChannels() {
    return (
      <div className="space-y-1">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="flex items-center gap-3 rounded-lg border p-3"
            style={{
              borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
              background: "var(--center-channel-bg)",
            }}
          >
            <Hash size={16} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>
                {ch.name}
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {ch.workspaces?.name} &middot; {t("admin.created", "Created")}{" "}
                {new Date(ch.created_at).toLocaleDateString()}
              </div>
            </div>
            {ch.is_private && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  background: "rgba(var(--away-indicator-rgb,255,188,66),0.12)",
                  color: "var(--away-indicator)",
                }}
              >
                {t("admin.private", "Private")}
              </span>
            )}
          </div>
        ))}
        {channelTotal > 20 && (
          <PaginationBar
            currentPage={channelPage + 1}
            totalPages={Math.ceil(channelTotal / 20)}
            onPrev={() => setChannelPage((p) => p - 1)}
            onNext={() => setChannelPage((p) => p + 1)}
          />
        )}
      </div>
    );
  }

  function renderWorkspaces() {
    return (
      <div className="space-y-1">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className="flex items-center gap-3 rounded-lg border p-3"
            style={{
              borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
              background: "var(--center-channel-bg)",
            }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "var(--button-bg)" }}
            >
              {ws.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>
                {ws.name}
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                /{ws.slug} &middot;{" "}
                {t("admin.membersCount", { count: String(ws.workspace_members?.[0]?.count ?? 0) })}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderIntegrations() {
    return (
      <div className="space-y-1">
        {integrations.length === 0 && (
          <EmptyState
            description={t("admin.noWebhooks", "No webhooks configured.")}
            className="!py-0"
          />
        )}
        {integrations.map((i) => (
          <div
            key={i.id}
            className="flex items-center gap-3 rounded-lg border p-3"
            style={{
              borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
              background: "var(--center-channel-bg)",
            }}
          >
            <Webhook size={16} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>
                {i.name}
              </div>
              <div className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>
                {i.url} &middot; {i.workspaces?.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderImportExport() {
    return (
      <div className="space-y-8">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: "var(--center-channel-color)" }}>
              {t("admin.exportData", "Export Data")}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {t("admin.format", "Format:")}
              </span>
              {(["csv", "json"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setExportFormat(f)}
                  className="rounded-md px-3 py-1 text-xs font-medium uppercase transition-colors"
                  style={{
                    background:
                      exportFormat === f
                        ? "var(--button-bg)"
                        : "rgba(var(--center-channel-color-rgb), 0.08)",
                    color:
                      exportFormat === f ? "var(--button-color)" : "var(--center-channel-color)",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: t("admin.workspaces", "Workspaces"),
                path: "/admin/export/workspaces",
                icon: <Globe size={16} />,
              },
              {
                label: t("admin.users", "Users"),
                path: "/admin/export/users",
                icon: <Users size={16} />,
              },
              {
                label: t("admin.channels", "Channels"),
                path: "/admin/export/channels",
                icon: <Hash size={16} />,
              },
              {
                label: t("admin.messages", "Messages"),
                path: "/admin/export/messages",
                icon: <MessageSquare size={16} />,
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={async () => {
                  setExporting(item.label);
                  try {
                    await downloadExport(item.path);
                  } finally {
                    setExporting(null);
                  }
                }}
                disabled={exporting === item.label}
                className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.04)] disabled:opacity-50"
                style={{
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  background: "var(--center-channel-bg)",
                  color: "var(--center-channel-color)",
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: "rgba(var(--button-bg-rgb), 0.12)",
                    color: "var(--button-bg)",
                  }}
                >
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    {exporting === item.label ? t("admin.exporting", "Exporting...") : item.label}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {t("admin.downloadAs", { format: exportFormat.toUpperCase() })}
                  </div>
                </div>
                <Download
                  size={16}
                  className="shrink-0"
                  style={{ color: "var(--text-tertiary)" }}
                />
              </button>
            ))}
          </div>
        </div>
        <hr style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.12)" }} />
        <div>
          <h2
            className="mb-4 text-lg font-semibold"
            style={{ color: "var(--center-channel-color)" }}
          >
            {t("admin.importData", "Import Data")}
          </h2>
          <div
            className="space-y-4 rounded-lg border p-4"
            style={{
              borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
              background: "var(--center-channel-bg)",
            }}
          >
            <div className="flex items-center gap-3">
              <label
                className="text-sm font-medium"
                style={{ color: "var(--center-channel-color)" }}
              >
                {t("admin.entityType", "Entity type:")}
              </label>
              <select
                value={importEndpoint}
                onChange={(e) => {
                  setImportEndpoint(e.target.value as "workspaces" | "users");
                  setImportResult(null);
                }}
                className="rounded-md border px-3 py-1.5 text-sm focus:outline-none"
                style={{
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  background: "var(--center-channel-bg)",
                  color: "var(--center-channel-color)",
                }}
              >
                <option value="workspaces">{t("admin.workspaces", "Workspaces")}</option>
                <option value="users">{t("admin.users", "Users")}</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label
                className="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.04)]"
                style={{
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  color: "var(--center-channel-color)",
                }}
              >
                <Upload size={16} />
                {importFile ? importFile.name : t("admin.chooseCSV", "Choose CSV file")}
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => {
                    handleFileSelect(e.target.files?.[0] ?? null);
                  }}
                  className="hidden"
                />
              </label>
              {!showCsvConfirm ? (
                <button
                  onClick={() => {
                    if (csvPreview) setShowCsvConfirm(true);
                    else handleImport();
                  }}
                  disabled={!importFile || importing}
                  className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
                  style={{ background: "var(--button-bg)" }}
                >
                  {importing ? t("admin.importing", "Importing...") : t("admin.import", "Import")}
                </button>
              ) : (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
                  style={{ background: "var(--dnd-indicator)" }}
                >
                  {importing
                    ? t("admin.importing", "Importing...")
                    : t("admin.confirmImport", { type: importEndpoint })}
                </button>
              )}
            </div>
            {csvPreview && !showCsvConfirm && importFile && (
              <div
                className="rounded-md border p-2"
                style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.12)" }}
              >
                <p className="mb-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {t("admin.previewRows", { count: csvPreview.length })}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <tbody>
                      {csvPreview.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="max-w-[200px] truncate border px-2 py-1"
                              style={{
                                borderColor: "rgba(var(--center-channel-color-rgb), 0.12)",
                                color: "var(--center-channel-color)",
                              }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {importResult && (
              <div
                className="rounded-md border p-3 text-sm"
                style={{
                  borderColor: importResult.errors?.length
                    ? "rgba(var(--dnd-indicator-rgb,214,66,66),0.3)"
                    : "rgba(var(--online-indicator-rgb,48,186,120),0.3)",
                  background: importResult.errors?.length
                    ? "rgba(var(--dnd-indicator-rgb,214,66,66),0.06)"
                    : "rgba(var(--online-indicator-rgb,48,186,120),0.06)",
                }}
              >
                <p style={{ color: "var(--center-channel-color)" }}>
                  {t("admin.importResult", { count: importResult.imported, type: importEndpoint })}
                </p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium" style={{ color: "var(--dnd-indicator)" }}>
                      {t("admin.errorCount", { count: importResult.errors.length })}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {importResult.errors.map((err, i) => (
                        <li key={i} className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderSecurity() {
    if (!security) return null;
    return (
      <div className="space-y-6">
        <Card>
          <h3
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--center-channel-color)" }}
          >
            {t("admin.authProviders", "Authentication Providers")}
          </h3>
          <div className="space-y-2">
            {Object.entries(security.authProviders).map(([key, provider]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-md px-3 py-2"
                style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}
              >
                <span className="text-sm" style={{ color: "var(--center-channel-color)" }}>
                  {provider.label}
                </span>
                <StatusBadge status={provider.enabled ? "enabled" : "disabled"} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--center-channel-color)" }}
          >
            {t("admin.rateLimiting", "Rate Limiting")}
          </h3>
          <div className="space-y-2">
            {security.rateLimiters.map((rl) => (
              <div
                key={rl.name}
                className="flex items-center justify-between rounded-md px-3 py-2"
                style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}
              >
                <span className="text-sm" style={{ color: "var(--center-channel-color)" }}>
                  {rl.name}
                </span>
                <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                  {rl.limit} {rl.unit}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--center-channel-color)" }}
          >
            {t("admin.securityHeaders", "Security Headers")}
          </h3>
          <div className="space-y-2">
            {security.securityHeaders.map((h) => (
              <div
                key={h.name}
                className="flex items-center justify-between rounded-md px-3 py-2"
                style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}
              >
                <code className="text-xs" style={{ color: "var(--center-channel-color)" }}>
                  {h.name}
                </code>
                <StatusBadge status={h.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--center-channel-color)" }}
          >
            {t("admin.sessionConfig", "Session Configuration")}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: t("admin.jwtAuth", "JWT Auth"),
                value: security.sessionConfig.jwtEnabled
                  ? t("admin.enabled", "Enabled")
                  : t("admin.disabled", "Disabled"),
              },
              {
                label: t("admin.sessionDuration", "Session Duration"),
                value: security.sessionConfig.sessionDuration,
              },
              {
                label: t("admin.refreshTokenRotation", "Refresh Token Rotation"),
                value: security.sessionConfig.refreshTokenRotation
                  ? t("admin.enabled", "Enabled")
                  : t("admin.disabled", "Disabled"),
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {item.label}
                </div>
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--center-channel-color)" }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  function renderAuditLog() {
    return (
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {t("admin.action", "Action:")}
            </label>
            <input
              value={auditFilter.action}
              onChange={(e) => setAuditFilter((f) => ({ ...f, action: e.target.value }))}
              placeholder={t("admin.filterByAction", "Filter by action...")}
              className="rounded border px-2 py-1 text-xs focus:outline-none"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
                width: 160,
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {t("admin.from", "From:")}
            </label>
            <input
              type="date"
              value={auditFilter.dateFrom}
              onChange={(e) => setAuditFilter((f) => ({ ...f, dateFrom: e.target.value }))}
              className="rounded border px-2 py-1 text-xs focus:outline-none"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {t("admin.to", "To:")}
            </label>
            <input
              type="date"
              value={auditFilter.dateTo}
              onChange={(e) => setAuditFilter((f) => ({ ...f, dateTo: e.target.value }))}
              className="rounded border px-2 py-1 text-xs focus:outline-none"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
            />
          </div>
        </div>
        <div className="space-y-1">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 rounded-lg border p-3"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
              }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: "var(--button-bg)" }}
              >
                {log.action.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--center-channel-color)" }}
                  >
                    {log.action}
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      background: "rgba(var(--center-channel-color-rgb), 0.08)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {log.entity_type}
                  </span>
                </div>
                <div className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {log.auth_users?.email ?? log.actor_user_id ?? t("admin.systemActor", "System")}
                  {log.entity_id ? ` \u00b7 ${log.entity_id}` : ""}
                  {log.organization_id
                    ? ` \u00b7 ${t("admin.workspaceLabel", "Workspace:")} ${log.organization_id.slice(0, 8)}...`
                    : ""}
                </div>
                <div
                  className="mt-1 text-[10px]"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }}
                >
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <EmptyState
              description={t("admin.noAuditLogs", "No audit log entries found.")}
              className="!py-0"
            />
          )}
        </div>
        {auditTotal > 50 && (
          <PaginationBar
            currentPage={auditPage + 1}
            totalPages={Math.ceil(auditTotal / 50)}
            onPrev={() => setAuditPage((p) => p - 1)}
            onNext={() => setAuditPage((p) => p + 1)}
          />
        )}
      </div>
    );
  }

  function renderSystem() {
    return (
      <div className="space-y-6">
        <Card>
          <h3
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--center-channel-color)" }}
          >
            {t("admin.serverHealth", "Server Health")}
          </h3>
          {health ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--center-channel-color)" }}>
                  {t("admin.overallStatus", "Overall Status")}
                </span>
                <StatusBadge status={health.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--center-channel-color)" }}>
                  {t("admin.uptime", "Uptime")}
                </span>
                <span className="font-mono text-sm" style={{ color: "var(--text-secondary)" }}>
                  {formatUptime(health.uptime)}
                </span>
              </div>
              {Object.entries(health.checks).map(([key, check]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-md px-3 py-2"
                  style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}
                >
                  <div className="flex items-center gap-2">
                    {key === "database" ? (
                      <Database size={14} style={{ color: "var(--text-tertiary)" }} />
                    ) : null}
                    <span
                      className="text-sm capitalize"
                      style={{ color: "var(--center-channel-color)" }}
                    >
                      {key}
                    </span>
                    {check.latencyMs !== undefined && (
                      <span
                        className="font-mono text-[10px]"
                        style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }}
                      >
                        {check.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={check.status} />
                    {check.queueCounts && Object.keys(check.queueCounts).length > 0 && (
                      <span
                        className="font-mono text-[10px]"
                        style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }}
                      >
                        {t("admin.queued", {
                          count: String(
                            Object.values(check.queueCounts).reduce((a, b) => a + b, 0),
                          ),
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {health.checks.workers?.queueCounts && (
                <div className="mt-2">
                  <div
                    className="mb-2 text-xs font-medium"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {t("admin.queueCounts", "Queue Counts")}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {Object.entries(health.checks.workers.queueCounts).map(([name, count]) => (
                      <div
                        key={name}
                        className="rounded-md px-3 py-2 text-center"
                        style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}
                      >
                        <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {name}
                        </div>
                        <div
                          className="font-mono text-sm font-bold"
                          style={{ color: "var(--center-channel-color)" }}
                        >
                          {count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {t("admin.noHealthData", "Could not fetch health data.")}
            </p>
          )}
        </Card>

        <Card>
          <h3
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--center-channel-color)" }}
          >
            {t("admin.systemInfo", "System Information")}
          </h3>
          {system ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: t("admin.version", "Version"), value: system.version },
                { label: t("admin.environment", "Environment"), value: system.environment },
                { label: t("admin.dbStatus", "DB Status"), value: system.database, badge: true },
                {
                  label: t("admin.dbLatency", "DB Latency"),
                  value: system.db_latency_ms ? `${system.db_latency_ms}ms` : "-",
                },
                { label: t("admin.uptime", "Uptime"), value: formatUptime(system.uptime_seconds) },
                {
                  label: t("admin.lastCheck", "Last Check"),
                  value: new Date(system.timestamp).toLocaleString(),
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {item.label}
                  </div>
                  <div
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: "var(--center-channel-color)" }}
                  >
                    {item.badge ? <StatusBadge status={item.value} /> : item.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {t("admin.noSystemInfo", "Could not fetch system info.")}
            </p>
          )}
        </Card>
      </div>
    );
  }

  function renderSiteConfig() {
    if (!siteConfig) return null;
    return (
      <div className="space-y-6">
        <Card>
          <h3
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--center-channel-color)" }}
          >
            {t("admin.application", "Application")}
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: t("admin.appName", "App Name"), value: siteConfig.appName },
              { label: t("admin.version", "Version"), value: siteConfig.version },
              { label: t("admin.environment", "Environment"), value: siteConfig.environment },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {item.label}
                </div>
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--center-channel-color)" }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--center-channel-color)" }}
          >
            {t("admin.urls", "URLs")}
          </h3>
          <div className="space-y-2">
            {[
              { label: t("admin.frontendUrl", "Frontend URL"), value: siteConfig.frontendUrl },
              { label: t("admin.apiUrl", "API URL"), value: siteConfig.apiUrl },
              {
                label: t("admin.supabaseProject", "Supabase Project"),
                value: siteConfig.supabaseProjectRef ?? t("common.na", "N/A"),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-md px-3 py-2"
                style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}
              >
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {item.label}
                </span>
                <code className="text-xs" style={{ color: "var(--center-channel-color)" }}>
                  {item.value}
                </code>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--center-channel-color)" }}
          >
            {t("admin.services", "Services")}
          </h3>
          <div className="space-y-2">
            {[
              { label: t("admin.redis", "Redis"), configured: siteConfig.redisConfigured },
              { label: t("admin.smtp", "SMTP"), configured: siteConfig.smtpConfigured },
              { label: t("admin.sentry", "Sentry"), configured: siteConfig.sentryConfigured },
              {
                label: t("admin.vapid", "VAPID (Web Push)"),
                configured: siteConfig.vapidConfigured,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-md px-3 py-2"
                style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}
              >
                <span className="text-sm" style={{ color: "var(--center-channel-color)" }}>
                  {item.label}
                </span>
                <StatusBadge status={item.configured ? "enabled" : "disabled"} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  function renderLogs() {
    return (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {t("admin.level", "Level:")}
          </span>
          {["", "error", "warn"].map((l) => (
            <button
              key={l}
              onClick={() => setLogLevel(l)}
              className="rounded-md px-3 py-1 text-xs font-medium transition-colors"
              style={{
                background:
                  logLevel === l
                    ? "var(--button-bg)"
                    : "rgba(var(--center-channel-color-rgb), 0.08)",
                color: logLevel === l ? "var(--button-color)" : "var(--center-channel-color)",
              }}
            >
              {l || t("admin.all", "all")}
            </button>
          ))}
          <button
            onClick={() => fetchTab("logs")}
            className="ml-auto rounded-md px-3 py-1 text-xs font-medium transition-colors"
            style={{
              background: "rgba(var(--center-channel-color-rgb), 0.08)",
              color: "var(--center-channel-color)",
            }}
          >
            <RefreshCw size={12} className="mr-1 inline" />
            {t("admin.refresh", "Refresh")}
          </button>
        </div>
        <div className="space-y-1">
          {logs.map((log, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border p-3"
              style={{
                borderColor:
                  log.level === "error"
                    ? "rgba(var(--dnd-indicator-rgb,214,66,66),0.3)"
                    : "rgba(var(--away-indicator-rgb,255,188,66),0.3)",
                background:
                  log.level === "error"
                    ? "rgba(var(--dnd-indicator-rgb,214,66,66),0.04)"
                    : "rgba(var(--away-indicator-rgb,255,188,66),0.04)",
              }}
            >
              {log.level === "error" ? (
                <XCircle
                  size={14}
                  className="mt-0.5 shrink-0"
                  style={{ color: "var(--dnd-indicator)" }}
                />
              ) : (
                <AlertTriangle
                  size={14}
                  className="mt-0.5 shrink-0"
                  style={{ color: "var(--away-indicator)" }}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-medium uppercase"
                    style={{
                      color:
                        log.level === "error" ? "var(--dnd-indicator)" : "var(--away-indicator)",
                    }}
                  >
                    {log.level}
                  </span>
                  <span className="text-xs" style={{ color: "var(--center-channel-color)" }}>
                    {log.message}
                  </span>
                </div>
                <div
                  className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }}
                >
                  {log.path && (
                    <span>
                      {t("admin.path", "Path:")} {log.path}
                    </span>
                  )}
                  {log.requestId && (
                    <span>
                      {t("admin.req", "Req:")} {log.requestId.slice(0, 8)}...
                    </span>
                  )}
                  {log.code && (
                    <span>
                      {t("admin.code", "Code:")} {log.code}
                    </span>
                  )}
                  {log.statusCode && (
                    <span>
                      {t("admin.statusLabel", "Status:")} {log.statusCode}
                    </span>
                  )}
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <EmptyState
              description={t("admin.noLogs", "No log entries captured yet.")}
              className="!py-0"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-0" style={{ minHeight: "calc(100vh - 56px)" }}>
      {/* Sidebar */}
      <nav
        className="hidden w-56 shrink-0 overflow-y-auto border-r p-3 md:block"
        style={{
          borderColor: "rgba(var(--center-channel-color-rgb), 0.12)",
          background: "var(--sidebar-bg)",
        }}
      >
        <div className="mb-4 px-2">
          <h2
            className="text-sm font-bold"
            style={{ color: "var(--sidebar-header-text-color, var(--center-channel-color))" }}
          >
            {t("admin.systemConsole", "System Console")}
          </h2>
        </div>
        {sidebarSections.map((section) => (
          <div key={section.label} className="mb-3">
            <div
              className="mb-1 px-2 text-[10px] font-semibold tracking-wider uppercase"
              style={{
                color:
                  "rgba(var(--sidebar-header-text-color-rgb, var(--center-channel-color-rgb)), 0.48)",
              }}
            >
              {section.label}
            </div>
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors"
                style={{
                  background: tab === item.id ? "rgba(var(--button-bg-rgb), 0.16)" : "transparent",
                  color:
                    tab === item.id
                      ? "var(--button-bg)"
                      : "rgba(var(--sidebar-header-text-color-rgb, var(--center-channel-color-rgb)), 0.72)",
                  fontWeight: tab === item.id ? 600 : 400,
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Content */}
      <div className="min-w-0 flex-1 overflow-y-auto p-6">
        {/* Breadcrumb */}
        <div
          className="mb-5 flex items-center gap-1.5 text-xs"
          style={{ color: "rgba(var(--center-channel-color-rgb), 0.48)" }}
        >
          <span>{t("admin.systemConsole", "System Console")}</span>
          <ChevronRight size={12} />
          <span style={{ color: "var(--center-channel-color)" }}>{tabLabel}</span>
        </div>
        <h1 className="mb-6 text-xl font-bold" style={{ color: "var(--center-channel-color)" }}>
          {tabLabel}
        </h1>
        {/* Mobile tab selector (hamburger) */}
        <div className="mb-4 md:hidden">
          <button
            onClick={() => setMobileTabOpen(!mobileTabOpen)}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            style={{
              borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
              backgroundColor: "var(--center-channel-bg)",
              color: "var(--center-channel-color)",
            }}
            aria-label={t("admin.toggleMenu", "Toggle menu")}
            aria-expanded={mobileTabOpen}
          >
            <Settings size={16} />
            <span className="flex-1 text-left">{tabLabel}</span>
            <ChevronRight
              size={14}
              className="transition-transform"
              style={{ transform: mobileTabOpen ? "rotate(90deg)" : "" }}
            />
          </button>
          {mobileTabOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/50"
                onClick={() => setMobileTabOpen(false)}
              />
              <nav
                className="fixed top-0 bottom-0 left-0 z-50 w-64 overflow-y-auto border-r p-3 shadow-[var(--elevation-5)]"
                style={{
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.12)",
                  background: "var(--sidebar-bg)",
                }}
                role="dialog"
                aria-modal="true"
                aria-label={t("admin.systemConsole", "System Console")}
              >
                <div className="mb-4 flex items-center justify-between px-2">
                  <h2
                    className="text-sm font-bold"
                    style={{
                      color: "var(--sidebar-header-text-color, var(--center-channel-color))",
                    }}
                  >
                    {t("admin.systemConsole", "System Console")}
                  </h2>
                  <button
                    onClick={() => setMobileTabOpen(false)}
                    className="rounded-md p-1 hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                    aria-label={t("common.close", "Close")}
                  >
                    <X size={16} />
                  </button>
                </div>
                {sidebarSections.map((section) => (
                  <div key={section.label} className="mb-3">
                    <div
                      className="mb-1 px-2 text-[10px] font-semibold tracking-wider uppercase"
                      style={{
                        color:
                          "rgba(var(--sidebar-header-text-color-rgb, var(--center-channel-color-rgb)), 0.48)",
                      }}
                    >
                      {section.label}
                    </div>
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setTab(item.id);
                          setMobileTabOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors"
                        style={{
                          background:
                            tab === item.id ? "rgba(var(--button-bg-rgb), 0.16)" : "transparent",
                          color:
                            tab === item.id
                              ? "var(--button-bg)"
                              : "rgba(var(--sidebar-header-text-color-rgb, var(--center-channel-color-rgb)), 0.72)",
                          fontWeight: tab === item.id ? 600 : 400,
                        }}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
            </>
          )}
        </div>
        {renderContent()}
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}
