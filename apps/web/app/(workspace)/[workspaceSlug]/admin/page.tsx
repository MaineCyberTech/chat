"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Skeleton } from "@chat/ui";

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
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  Eye,
  EyeOff,
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
  checks: Record<string, { status: string; latencyMs?: number; message?: string; queueCounts?: Record<string, number> }>;
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

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "healthy" || status === "enabled" || status === "connected"
      ? "var(--online-indicator)"
      : status === "degraded" || status === "warn"
        ? "var(--away-indicator)"
        : "var(--dnd-indicator)";
  const Icon = status === "healthy" || status === "enabled" || status === "connected" ? CheckCircle
    : status === "degraded" || status === "warn" ? AlertTriangle
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

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
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

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importEndpoint, setImportEndpoint] = useState<"workspaces" | "users">("workspaces");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors?: string[] } | null>(null);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  async function downloadExport(path: string) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
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
      setError(e instanceof Error ? e.message : "Export failed");
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    }
    setImporting(false);
  }

  const fetchTab = useCallback(async (t: Tab) => {
    setError(null);
    setLoading(true);
    try {
      if (t === "overview") {
        const res = await api.get<{ stats: Stats }>("/admin/stats");
        setStats(res.stats);
      } else if (t === "users") {
        const res = await api.get<{ users: AuthUser[]; total: number }>(
          `/admin/users?search=${encodeURIComponent(userSearch)}&page=${userPage}`,
        );
        setUsers(res.users);
        setUserTotal(res.total);
      } else if (t === "channels") {
        const res = await api.get<{ channels: AdminChannel[]; total: number }>(
          `/admin/channels?page=${channelPage}`,
        );
        setChannels(res.channels);
        setChannelTotal(res.total);
      } else if (t === "workspaces") {
        const res = await api.get<{ workspaces: AdminWorkspace[] }>("/admin/workspaces");
        setWorkspaces(res.workspaces);
      } else if (t === "integrations") {
        const res = await api.get<{ integrations: AdminIntegration[] }>("/admin/integrations");
        setIntegrations(res.integrations);
      } else if (t === "security") {
        const res = await api.get<SecurityInfo>("/admin/security");
        setSecurity(res);
      } else if (t === "audit-log") {
        const params = new URLSearchParams({ page: String(auditPage), limit: "50" });
        if (auditFilter.action) params.set("action", auditFilter.action);
        if (auditFilter.dateFrom) params.set("dateFrom", auditFilter.dateFrom);
        if (auditFilter.dateTo) params.set("dateTo", auditFilter.dateTo);
        const res = await api.get<{ logs: AuditLogEntry[]; total: number }>(
          `/admin/audit-logs?${params.toString()}`,
        );
        setAuditLogs(res.logs);
        setAuditTotal(res.total);
      } else if (t === "system") {
        const [hRes, sRes] = await Promise.all([
          api.get<HealthInfo>("/admin/health"),
          api.get<SystemInfo>("/admin/system"),
        ]);
        setHealth(hRes);
        setSystem(sRes);
      } else if (t === "site-config") {
        const res = await api.get<SiteConfig>("/admin/config");
        setSiteConfig(res);
      } else if (t === "logs") {
        const params = new URLSearchParams({ limit: "200" });
        if (logLevel) params.set("level", logLevel);
        const res = await api.get<{ logs: LogEntry[] }>(`/admin/logs?${params.toString()}`);
        setLogs(res.logs);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
    setLoading(false);
  }, [userSearch, userPage, channelPage, auditPage, auditFilter, logLevel]);

  useEffect(() => { fetchTab(tab); }, [tab, fetchTab]);
  useEffect(() => {
    if (tab === "users") { setUserPage(0); fetchTab("users"); }
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
      label: "System Settings",
      items: [
        { id: "overview", label: "Overview", icon: <Shield size={16} /> },
        { id: "security", label: "Security", icon: <Lock size={16} /> },
        { id: "site-config", label: "Site Configuration", icon: <Settings size={16} /> },
      ],
    },
    {
      label: "User Management",
      items: [
        { id: "users", label: "Users", icon: <Users size={16} /> },
        { id: "channels", label: "Channels", icon: <Hash size={16} /> },
        { id: "workspaces", label: "Workspaces", icon: <Globe size={16} /> },
      ],
    },
    {
      label: "Integrations",
      items: [
        { id: "integrations", label: "Webhooks", icon: <Webhook size={16} /> },
      ],
    },
    {
      label: "Compliance",
      items: [
        { id: "audit-log", label: "Audit Log", icon: <FileText size={16} /> },
        { id: "import-export", label: "Import/Export", icon: <Download size={16} /> },
      ],
    },
    {
      label: "Troubleshooting",
      items: [
        { id: "system", label: "System Info", icon: <Server size={16} /> },
        { id: "logs", label: "Logs", icon: <Activity size={16} /> },
      ],
    },
  ];

  const tabLabel = sidebarSections.flatMap((s) => s.items).find((i) => i.id === tab)?.label ?? tab;

  function renderContent() {
    if (loading) {
      return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border p-4" style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}>
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
          <p className="mb-3 text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>{error}</p>
          <button
            onClick={() => { setError(null); fetchTab(tab); }}
            className="rounded-md px-4 py-2 text-xs font-medium text-white"
            style={{ background: "var(--button-bg)" }}
          >
            Retry
          </button>
        </div>
      );
    }

    switch (tab) {
      case "overview": return renderOverview();
      case "users": return renderUsers();
      case "channels": return renderChannels();
      case "workspaces": return renderWorkspaces();
      case "integrations": return renderIntegrations();
      case "import-export": return renderImportExport();
      case "security": return renderSecurity();
      case "audit-log": return renderAuditLog();
      case "system": return renderSystem();
      case "site-config": return renderSiteConfig();
      case "logs": return renderLogs();
      default: return null;
    }
  }

  function renderOverview() {
    if (!stats) return null;
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Users", value: stats.users, icon: <Users size={24} />, color: "var(--button-bg)" },
          { label: "Workspaces", value: stats.workspaces, icon: <Globe size={24} />, color: "var(--online-indicator)" },
          { label: "Channels", value: stats.channels, icon: <Hash size={24} />, color: "var(--away-indicator)" },
          { label: "Messages", value: stats.messages, icon: <MessageSquare size={24} />, color: "var(--dnd-indicator)" },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border p-4"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)" }}
          >
            <div className="mb-2" style={{ color: card.color }}>{card.icon}</div>
            <div className="text-2xl font-bold" style={{ color: "var(--center-channel-color)" }}>
              {card.value?.toLocaleString() ?? "-"}
            </div>
            <div className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>{card.label}</div>
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
            <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }} />
            <input value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setUserPage(0); }}
              placeholder="Search users..." className="w-full rounded-lg border px-8 py-2 text-sm focus:outline-none"
              style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)", color: "var(--center-channel-color)" }} />
            {userSearch && (
              <button onClick={() => setUserSearch("")} className="absolute top-1/2 right-3 -translate-y-1/2"><X size={14} /></button>
            )}
          </div>
        </div>
        <div className="space-y-1">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-lg border p-3"
              style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)" }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "var(--button-bg)" }}>
                {(u.display_name ?? u.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>{u.display_name || u.email.split("@")[0]}</div>
                <div className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>{u.email} &middot; Joined {new Date(u.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
        {userTotal > 20 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
            <button disabled={userPage === 0} onClick={() => setUserPage((p) => p - 1)}
              className="rounded px-2 py-1 hover:bg-[rgba(var(--center-channel-color-rgb),0.08)] disabled:opacity-30">Previous</button>
            <span>Page {userPage + 1} of {Math.ceil(userTotal / 20)}</span>
            <button disabled={(userPage + 1) * 20 >= userTotal} onClick={() => setUserPage((p) => p + 1)}
              className="rounded px-2 py-1 hover:bg-[rgba(var(--center-channel-color-rgb),0.08)] disabled:opacity-30">Next</button>
          </div>
        )}
      </div>
    );
  }

  function renderChannels() {
    return (
      <div className="space-y-1">
        {channels.map((ch) => (
          <div key={ch.id} className="flex items-center gap-3 rounded-lg border p-3"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)" }}>
            <Hash size={16} className="shrink-0" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>{ch.name}</div>
              <div className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
                {ch.workspaces?.name} &middot; Created {new Date(ch.created_at).toLocaleDateString()}
              </div>
            </div>
            {ch.is_private && (
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: "rgba(var(--away-indicator-rgb,255,188,66),0.12)", color: "var(--away-indicator)" }}>Private</span>
            )}
          </div>
        ))}
        {channelTotal > 20 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
            <button disabled={channelPage === 0} onClick={() => setChannelPage((p) => p - 1)}>Previous</button>
            <span>Page {channelPage + 1} of {Math.ceil(channelTotal / 20)}</span>
            <button disabled={(channelPage + 1) * 20 >= channelTotal} onClick={() => setChannelPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>
    );
  }

  function renderWorkspaces() {
    return (
      <div className="space-y-1">
        {workspaces.map((ws) => (
          <div key={ws.id} className="flex items-center gap-3 rounded-lg border p-3"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)" }}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "var(--button-bg)" }}>{ws.name.charAt(0)}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>{ws.name}</div>
              <div className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
                /{ws.slug} &middot; {ws.workspace_members?.[0]?.count ?? 0} members
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
          <p className="text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>No webhooks configured.</p>
        )}
        {integrations.map((i) => (
          <div key={i.id} className="flex items-center gap-3 rounded-lg border p-3"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)" }}>
            <Webhook size={16} className="shrink-0" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>{i.name}</div>
              <div className="truncate text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
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
            <h2 className="text-lg font-semibold" style={{ color: "var(--center-channel-color)" }}>Export Data</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>Format:</span>
              {(["csv", "json"] as const).map((f) => (
                <button key={f} onClick={() => setExportFormat(f)}
                  className="rounded-md px-3 py-1 text-xs font-medium uppercase transition-colors"
                  style={{ background: exportFormat === f ? "var(--button-bg)" : "rgba(var(--center-channel-color-rgb), 0.08)", color: exportFormat === f ? "#fff" : "var(--center-channel-color)" }}>{f}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Workspaces", path: "/admin/export/workspaces", icon: <Globe size={16} /> },
              { label: "Users", path: "/admin/export/users", icon: <Users size={16} /> },
              { label: "Channels", path: "/admin/export/channels", icon: <Hash size={16} /> },
              { label: "Messages", path: "/admin/export/messages", icon: <MessageSquare size={16} /> },
            ].map((item) => (
              <button key={item.label} onClick={() => downloadExport(item.path)}
                className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.04)]"
                style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)", color: "var(--center-channel-color)" }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(var(--button-bg-rgb), 0.12)", color: "var(--button-bg)" }}>{item.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>Download as {exportFormat.toUpperCase()}</div>
                </div>
                <Download size={16} className="shrink-0" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }} />
              </button>
            ))}
          </div>
        </div>
        <hr style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.12)" }} />
        <div>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--center-channel-color)" }}>Import Data</h2>
          <div className="space-y-4 rounded-lg border p-4" style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)" }}>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>Entity type:</label>
              <select value={importEndpoint} onChange={(e) => { setImportEndpoint(e.target.value as "workspaces" | "users"); setImportResult(null); }}
                className="rounded-md border px-3 py-1.5 text-sm focus:outline-none"
                style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)", color: "var(--center-channel-color)" }}>
                <option value="workspaces">Workspaces</option>
                <option value="users">Users</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.04)]"
                style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", color: "var(--center-channel-color)" }}>
                <Upload size={16} />{importFile ? importFile.name : "Choose CSV file"}
                <input type="file" accept=".csv,.txt" onChange={(e) => { setImportFile(e.target.files?.[0] ?? null); setImportResult(null); }} className="hidden" />
              </label>
              <button onClick={handleImport} disabled={!importFile || importing}
                className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ background: "var(--button-bg)" }}>
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
            {importResult && (
              <div className="rounded-md border p-3 text-sm" style={{
                borderColor: importResult.errors?.length ? "rgba(var(--dnd-indicator-rgb,214,66,66),0.3)" : "rgba(var(--online-indicator-rgb,48,186,120),0.3)",
                background: importResult.errors?.length ? "rgba(var(--dnd-indicator-rgb,214,66,66),0.06)" : "rgba(var(--online-indicator-rgb,48,186,120),0.06)",
              }}>
                <p style={{ color: "var(--center-channel-color)" }}>Successfully imported <strong>{importResult.imported}</strong> {importEndpoint}.</p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium" style={{ color: "var(--dnd-indicator)" }}>{importResult.errors.length} error(s):</p>
                    <ul className="mt-1 space-y-0.5">
                      {importResult.errors.map((err, i) => (
                        <li key={i} className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>{err}</li>
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
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>Authentication Providers</h3>
          <div className="space-y-2">
            {Object.entries(security.authProviders).map(([key, provider]) => (
              <div key={key} className="flex items-center justify-between rounded-md px-3 py-2"
                style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}>
                <span className="text-sm" style={{ color: "var(--center-channel-color)" }}>{provider.label}</span>
                <StatusBadge status={provider.enabled ? "enabled" : "disabled"} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>Rate Limiting</h3>
          <div className="space-y-2">
            {security.rateLimiters.map((rl) => (
              <div key={rl.name} className="flex items-center justify-between rounded-md px-3 py-2"
                style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}>
                <span className="text-sm" style={{ color: "var(--center-channel-color)" }}>{rl.name}</span>
                <span className="text-xs font-mono" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
                  {rl.limit} {rl.unit}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>Security Headers</h3>
          <div className="space-y-2">
            {security.securityHeaders.map((h) => (
              <div key={h.name} className="flex items-center justify-between rounded-md px-3 py-2"
                style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}>
                <code className="text-xs" style={{ color: "var(--center-channel-color)" }}>{h.name}</code>
                <StatusBadge status={h.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>Session Configuration</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "JWT Auth", value: security.sessionConfig.jwtEnabled ? "Enabled" : "Disabled" },
              { label: "Session Duration", value: security.sessionConfig.sessionDuration },
              { label: "Refresh Token Rotation", value: security.sessionConfig.refreshTokenRotation ? "Enabled" : "Disabled" },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>{item.label}</div>
                <div className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>{item.value}</div>
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
            <label className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>Action:</label>
            <input value={auditFilter.action} onChange={(e) => setAuditFilter((f) => ({ ...f, action: e.target.value }))}
              placeholder="Filter by action..." className="rounded border px-2 py-1 text-xs focus:outline-none"
              style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)", color: "var(--center-channel-color)", width: 160 }} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>From:</label>
            <input type="date" value={auditFilter.dateFrom} onChange={(e) => setAuditFilter((f) => ({ ...f, dateFrom: e.target.value }))}
              className="rounded border px-2 py-1 text-xs focus:outline-none"
              style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)", color: "var(--center-channel-color)" }} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>To:</label>
            <input type="date" value={auditFilter.dateTo} onChange={(e) => setAuditFilter((f) => ({ ...f, dateTo: e.target.value }))}
              className="rounded border px-2 py-1 text-xs focus:outline-none"
              style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)", color: "var(--center-channel-color)" }} />
          </div>
        </div>
        <div className="space-y-1">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3"
              style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)" }}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: "var(--button-bg)" }}>
                {log.action.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>{log.action}</span>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)", color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
                    {log.entity_type}
                  </span>
                </div>
                <div className="mt-0.5 text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
                  {log.auth_users?.email ?? log.actor_user_id ?? "system"}
                  {log.entity_id ? ` \u00b7 ${log.entity_id}` : ""}
                  {log.organization_id ? ` \u00b7 workspace: ${log.organization_id.slice(0, 8)}...` : ""}
                </div>
                <div className="mt-1 text-[10px]" style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }}>
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <p className="text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>No audit log entries found.</p>
          )}
        </div>
        {auditTotal > 50 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
            <button disabled={auditPage === 0} onClick={() => setAuditPage((p) => p - 1)}
              className="rounded px-2 py-1 hover:bg-[rgba(var(--center-channel-color-rgb),0.08)] disabled:opacity-30">Previous</button>
            <span>Page {auditPage + 1} of {Math.ceil(auditTotal / 50)}</span>
            <button disabled={(auditPage + 1) * 50 >= auditTotal} onClick={() => setAuditPage((p) => p + 1)}
              className="rounded px-2 py-1 hover:bg-[rgba(var(--center-channel-color-rgb),0.08)] disabled:opacity-30">Next</button>
          </div>
        )}
      </div>
    );
  }

  function renderSystem() {
    return (
      <div className="space-y-6">
        <Card>
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>Server Health</h3>
          {health ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--center-channel-color)" }}>Overall Status</span>
                <StatusBadge status={health.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--center-channel-color)" }}>Uptime</span>
                <span className="text-sm font-mono" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
                  {formatUptime(health.uptime)}
                </span>
              </div>
              {Object.entries(health.checks).map(([key, check]) => (
                <div key={key} className="flex items-center justify-between rounded-md px-3 py-2"
                  style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}>
                  <div className="flex items-center gap-2">
                    {key === "database" ? <Database size={14} style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }} /> : null}
                    <span className="text-sm capitalize" style={{ color: "var(--center-channel-color)" }}>{key}</span>
                    {check.latencyMs !== undefined && (
                      <span className="text-[10px] font-mono" style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }}>
                        {check.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={check.status} />
                    {check.queueCounts && Object.keys(check.queueCounts).length > 0 && (
                      <span className="text-[10px] font-mono" style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }}>
                        {Object.values(check.queueCounts).reduce((a, b) => a + b, 0)} queued
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {health.checks.workers?.queueCounts && (
                <div className="mt-2">
                  <div className="mb-2 text-xs font-medium" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>Queue Counts</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {Object.entries(health.checks.workers.queueCounts).map(([name, count]) => (
                      <div key={name} className="rounded-md px-3 py-2 text-center"
                        style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}>
                        <div className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>{name}</div>
                        <div className="text-sm font-bold font-mono" style={{ color: "var(--center-channel-color)" }}>{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>Could not fetch health data.</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>System Information</h3>
          {system ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Version", value: system.version },
                { label: "Environment", value: system.environment },
                { label: "DB Status", value: system.database, badge: true },
                { label: "DB Latency", value: system.db_latency_ms ? `${system.db_latency_ms}ms` : "-" },
                { label: "Uptime", value: formatUptime(system.uptime_seconds) },
                { label: "Last Check", value: new Date(system.timestamp).toLocaleString() },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>{item.label}</div>
                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>
                    {item.badge ? <StatusBadge status={item.value} /> : item.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>Could not fetch system info.</p>
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
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>Application</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: "App Name", value: siteConfig.appName },
              { label: "Version", value: siteConfig.version },
              { label: "Environment", value: siteConfig.environment },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>{item.label}</div>
                <div className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>URLs</h3>
          <div className="space-y-2">
            {[
              { label: "Frontend URL", value: siteConfig.frontendUrl },
              { label: "API URL", value: siteConfig.apiUrl },
              { label: "Supabase Project", value: siteConfig.supabaseProjectRef ?? "N/A" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-md px-3 py-2"
                style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}>
                <span className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>{item.label}</span>
                <code className="text-xs" style={{ color: "var(--center-channel-color)" }}>{item.value}</code>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>Services</h3>
          <div className="space-y-2">
            {[
              { label: "Redis", configured: siteConfig.redisConfigured },
              { label: "SMTP", configured: siteConfig.smtpConfigured },
              { label: "Sentry", configured: siteConfig.sentryConfigured },
              { label: "VAPID (Web Push)", configured: siteConfig.vapidConfigured },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-md px-3 py-2"
                style={{ background: "rgba(var(--center-channel-color-rgb), 0.04)" }}>
                <span className="text-sm" style={{ color: "var(--center-channel-color)" }}>{item.label}</span>
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
          <span className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>Level:</span>
          {["", "error", "warn"].map((l) => (
            <button key={l} onClick={() => setLogLevel(l)}
              className="rounded-md px-3 py-1 text-xs font-medium transition-colors"
              style={{
                background: logLevel === l ? "var(--button-bg)" : "rgba(var(--center-channel-color-rgb), 0.08)",
                color: logLevel === l ? "#fff" : "var(--center-channel-color)",
              }}>
              {l || "all"}
            </button>
          ))}
          <button onClick={() => fetchTab("logs")} className="ml-auto rounded-md px-3 py-1 text-xs font-medium transition-colors"
            style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)", color: "var(--center-channel-color)" }}>
            <RefreshCw size={12} className="inline mr-1" />Refresh
          </button>
        </div>
        <div className="space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border p-3"
              style={{
                borderColor: log.level === "error" ? "rgba(var(--dnd-indicator-rgb,214,66,66),0.3)" : "rgba(var(--away-indicator-rgb,255,188,66),0.3)",
                background: log.level === "error" ? "rgba(var(--dnd-indicator-rgb,214,66,66),0.04)" : "rgba(var(--away-indicator-rgb,255,188,66),0.04)",
              }}>
              {log.level === "error" ? <XCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--dnd-indicator)" }} />
                : <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--away-indicator)" }} />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase" style={{ color: log.level === "error" ? "var(--dnd-indicator)" : "var(--away-indicator)" }}>
                    {log.level}
                  </span>
                  <span className="text-xs" style={{ color: "var(--center-channel-color)" }}>{log.message}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]" style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }}>
                  {log.path && <span>Path: {log.path}</span>}
                  {log.requestId && <span>Req: {log.requestId.slice(0, 8)}...</span>}
                  {log.code && <span>Code: {log.code}</span>}
                  {log.statusCode && <span>Status: {log.statusCode}</span>}
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>No log entries captured yet.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-0" style={{ minHeight: "calc(100vh - 56px)" }}>
      {/* Sidebar */}
      <nav className="hidden w-56 shrink-0 overflow-y-auto border-r p-3 md:block"
        style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.12)", background: "var(--sidebar-bg)" }}>
        <div className="mb-4 px-2">
          <h2 className="text-sm font-bold" style={{ color: "var(--sidebar-header-text-color, var(--center-channel-color))" }}>
            System Console
          </h2>
        </div>
        {sidebarSections.map((section) => (
          <div key={section.label} className="mb-3">
            <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "rgba(var(--sidebar-header-text-color-rgb, var(--center-channel-color-rgb)), 0.48)" }}>
              {section.label}
            </div>
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors"
                style={{
                  background: tab === item.id ? "rgba(var(--button-bg-rgb), 0.16)" : "transparent",
                  color: tab === item.id ? "var(--button-bg)" : "rgba(var(--sidebar-header-text-color-rgb, var(--center-channel-color-rgb)), 0.72)",
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
        <div className="mb-5 flex items-center gap-1.5 text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.48)" }}>
          <span>System Console</span>
          <ChevronRight size={12} />
          <span style={{ color: "var(--center-channel-color)" }}>{tabLabel}</span>
        </div>
        <h1 className="mb-6 text-xl font-bold" style={{ color: "var(--center-channel-color)" }}>
          {tabLabel}
        </h1>
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
