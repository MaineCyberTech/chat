"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Skeleton } from "@chat/ui";
import { Shield, Users, Hash, MessageSquare, Globe, Webhook, Search, X, Download, Upload } from "lucide-react";

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

type Tab = "overview" | "users" | "channels" | "workspaces" | "integrations" | "import-export";

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

  const fetchTab = async (t: Tab) => {
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
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      console.warn("Failed to fetch admin data");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTab(tab);
  }, [tab]);
  useEffect(() => {
    if (tab === "users") fetchTab("users");
  }, [userSearch, userPage]);
  useEffect(() => {
    if (tab === "channels") fetchTab("channels");
  }, [channelPage]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Shield size={16} /> },
    { id: "users", label: "Users", icon: <Users size={16} /> },
    { id: "channels", label: "Channels", icon: <Hash size={16} /> },
    { id: "workspaces", label: "Workspaces", icon: <Globe size={16} /> },
    { id: "integrations", label: "Integrations", icon: <Webhook size={16} /> },
    { id: "import-export", label: "Import/Export", icon: <Download size={16} /> },
  ];

  return (
    <div className="mx-auto flex max-w-6xl gap-6 p-6">
      {/* Sidebar */}
      <nav className="w-48 shrink-0 space-y-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors"
            style={{
              background: tab === t.id ? "rgba(var(--button-bg-rgb), 0.12)" : "transparent",
              color: tab === t.id ? "var(--button-bg)" : "var(--center-channel-color)",
              fontWeight: tab === t.id ? 600 : 400,
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h1 className="mb-6 text-2xl font-bold" style={{ color: "var(--center-channel-color)" }}>
          System Console
        </h1>

        {loading && tab !== "import-export" ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border p-4" style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}>
                <Skeleton className="mb-2 h-6 w-6" />
                <Skeleton className="mb-2 h-8 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : error ? (
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
        ) : tab === "overview" && stats ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              {
                label: "Users",
                value: stats.users,
                icon: <Users size={24} />,
                color: "var(--button-bg)",
              },
              {
                label: "Workspaces",
                value: stats.workspaces,
                icon: <Globe size={24} />,
                color: "var(--online-indicator)",
              },
              {
                label: "Channels",
                value: stats.channels,
                icon: <Hash size={24} />,
                color: "var(--away-indicator)",
              },
              {
                label: "Messages",
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
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--center-channel-color)" }}
                >
                  {card.value?.toLocaleString() ?? "-"}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                >
                  {card.label}
                </div>
              </div>
            ))}
          </div>
        ) : tab === "users" ? (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute top-1/2 left-3 -translate-y-1/2"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                />
                <input
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(0);
                  }}
                  placeholder="Search users..."
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
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: "var(--button-bg)" }}
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
                    <div
                      className="text-xs"
                      style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                    >
                      {u.email} &middot; Joined {new Date(u.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {userTotal > 20 && (
              <div
                className="mt-4 flex items-center justify-center gap-2 text-xs"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                <button
                  disabled={userPage === 0}
                  onClick={() => setUserPage((p) => p - 1)}
                  className="rounded px-2 py-1 hover:bg-[rgba(var(--center-channel-color-rgb),0.08)] disabled:opacity-30"
                >
                  Previous
                </button>
                <span>
                  Page {userPage + 1} of {Math.ceil(userTotal / 20)}
                </span>
                <button
                  disabled={(userPage + 1) * 20 >= userTotal}
                  onClick={() => setUserPage((p) => p + 1)}
                  className="rounded px-2 py-1 hover:bg-[rgba(var(--center-channel-color-rgb),0.08)] disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : tab === "channels" ? (
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
                <Hash
                  size={16}
                  className="shrink-0"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--center-channel-color)" }}
                  >
                    {ch.name}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                  >
                    {ch.workspaces?.name} &middot; Created{" "}
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
                    Private
                  </span>
                )}
              </div>
            ))}
            {channelTotal > 20 && (
              <div
                className="mt-4 flex items-center justify-center gap-2 text-xs"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                <button disabled={channelPage === 0} onClick={() => setChannelPage((p) => p - 1)}>
                  Previous
                </button>
                <span>
                  Page {channelPage + 1} of {Math.ceil(channelTotal / 20)}
                </span>
                <button
                  disabled={(channelPage + 1) * 20 >= channelTotal}
                  onClick={() => setChannelPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : tab === "workspaces" ? (
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
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--center-channel-color)" }}
                  >
                    {ws.name}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                  >
                    /{ws.slug} &middot; {ws.workspace_members?.[0]?.count ?? 0} members
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tab === "integrations" ? (
          <div className="space-y-1">
            {integrations.length === 0 && (
              <p
                className="text-sm"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                No webhooks configured.
              </p>
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
                <Webhook
                  size={16}
                  className="shrink-0"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--center-channel-color)" }}
                  >
                    {i.name}
                  </div>
                  <div
                    className="truncate text-xs"
                    style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                  >
                    {i.url} &middot; {i.workspaces?.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tab === "import-export" ? (
          <div className="space-y-8">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color: "var(--center-channel-color)" }}>Export Data</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>Format:</span>
                  {(["csv", "json"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setExportFormat(f)}
                      className="rounded-md px-3 py-1 text-xs font-medium uppercase transition-colors"
                      style={{
                        background: exportFormat === f ? "var(--button-bg)" : "rgba(var(--center-channel-color-rgb), 0.08)",
                        color: exportFormat === f ? "#fff" : "var(--center-channel-color)",
                      }}
                    >
                      {f}
                    </button>
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
                  <button
                    key={item.label}
                    onClick={() => downloadExport(item.path)}
                    className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.04)]"
                    style={{
                      borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                      background: "var(--center-channel-bg)",
                      color: "var(--center-channel-color)",
                    }}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(var(--button-bg-rgb), 0.12)", color: "var(--button-bg)" }}>
                      {item.icon}
                    </div>
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
                  <select
                    value={importEndpoint}
                    onChange={(e) => { setImportEndpoint(e.target.value as "workspaces" | "users"); setImportResult(null); }}
                    className="rounded-md border px-3 py-1.5 text-sm focus:outline-none"
                    style={{
                      borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                      background: "var(--center-channel-bg)",
                      color: "var(--center-channel-color)",
                    }}
                  >
                    <option value="workspaces">Workspaces</option>
                    <option value="users">Users</option>
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
                    {importFile ? importFile.name : "Choose CSV file"}
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={(e) => { setImportFile(e.target.files?.[0] ?? null); setImportResult(null); }}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleImport}
                    disabled={!importFile || importing}
                    className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
                    style={{ background: "var(--button-bg)" }}
                  >
                    {importing ? "Importing..." : "Import"}
                  </button>
                </div>

                {importResult && (
                  <div className="rounded-md border p-3 text-sm" style={{
                    borderColor: importResult.errors?.length ? "rgba(var(--dnd-indicator-rgb,214,66,66),0.3)" : "rgba(var(--online-indicator-rgb,48,186,120),0.3)",
                    background: importResult.errors?.length ? "rgba(var(--dnd-indicator-rgb,214,66,66),0.06)" : "rgba(var(--online-indicator-rgb,48,186,120),0.06)",
                  }}>
                    <p style={{ color: "var(--center-channel-color)" }}>
                      Successfully imported <strong>{importResult.imported}</strong> {importEndpoint}.
                    </p>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium" style={{ color: "var(--dnd-indicator)" }}>
                          {importResult.errors.length} error(s):
                        </p>
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
        ) : null}
      </div>
    </div>
  );
}
