"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { Button, SidebarGroup, Skeleton, useToast } from "@chat/ui";
import { Bell, BellOff } from "lucide-react";
import type { UserPreferences, ThemePreference } from "@chat/db";

interface NotificationPrefs {
  desktop_notifications: boolean;
  message_notifications: boolean;
  mention_notifications: boolean;
  mention_notification_sound: boolean;
  email_mode: "immediate" | "digest" | "off";
  digest: "never" | "daily" | "weekly";
  sound?: string;
  trigger_words?: string[];
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const { addToast } = useToast();
  const [channelPrefs, setChannelPrefs] = useState<Map<string, boolean>>(new Map());
  const [channels, setChannels] = useState<
    { id: string; workspace_id: string; name: string; slug: string }[]
  >([]);
  const [notifSaving, setNotifSaving] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    fetchPreferences();
    fetchChannels();
  }, [authLoading]);

  async function fetchChannels() {
    try {
      const wsRes = await api.get<{ workspaces: { id: string }[] }>("/workspaces");
      const ws = wsRes.workspaces[0];
      if (!ws) return;
      const chRes = await api.get<{
        channels: { id: string; workspace_id: string; name: string; slug: string }[];
      }>(`/workspaces/${ws.id}/channels`);
      setChannels(chRes.channels);

      const prefsRes = await api.get<{
        preferences: Array<{ channel_id: string; notify: boolean }>;
      }>("/notifications/preferences");
      const prefMap = new Map<string, boolean>();
      prefsRes.preferences.forEach((p) => prefMap.set(p.channel_id, p.notify));
      setChannelPrefs(prefMap);
    } catch {
      console.warn("Failed to fetch channels");
    }
  }

  async function toggleChannelNotif(channelId: string, current: boolean) {
    setNotifSaving(channelId);
    try {
      await api.put(`/notifications/channels/${channelId}`, { notify: !current });
      setChannelPrefs((prev) => {
        const next = new Map(prev);
        next.set(channelId, !current);
        return next;
      });
    } catch {
      addToast({ title: "Failed to update notification preference", variant: "error" });
    } finally {
      setNotifSaving(null);
    }
  }

  async function fetchPreferences() {
    setLoading(true);
    try {
      const res = await api.get<{ preferences: UserPreferences }>("/preferences");
      setPreferences(res.preferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch preferences");
      console.error("Failed to fetch preferences:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleThemeChange(theme: ThemePreference) {
    const updated = { ...preferences, theme } as UserPreferences;
    setPreferences(updated);
    await savePreferences({ theme });
  }

  function handleNotificationChange(
    key: keyof NotificationPrefs,
    value: boolean | NotificationPrefs["digest"] | string | string[],
  ) {
    const current = (preferences?.notification_prefs ?? {}) as Record<string, unknown>;
    const updated = {
      ...preferences,
      notification_prefs: { ...current, [key]: value },
    } as UserPreferences;
    setPreferences(updated);
  }

  async function savePreferences(patch: Partial<UserPreferences>) {
    if (!preferences) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      await api.patch("/preferences", patch);
      setSaveStatus("success");
      setSaveMessage("Preferences saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveStatus("error");
      setSaveMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAll() {
    if (!preferences) return;
    await savePreferences({
      theme: preferences.theme,
      clock_format: preferences.clock_format,
      message_display: preferences.message_display,
      sidebar_show_display_name: preferences.sidebar_show_display_name,
      sidebar_sort_alphabetical: preferences.sidebar_sort_alphabetical,
      notification_prefs: preferences.notification_prefs,
    });
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-48 rounded-md" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full rounded-md" />
          <Skeleton className="h-6 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center p-6">
        <p className="mb-3 text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>{error}</p>
        <button
          onClick={() => { setError(null); fetchPreferences(); }}
          className="rounded-md px-4 py-2 text-xs font-medium text-white"
          style={{ background: "var(--button-bg)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user) return null;

  const theme = preferences?.theme ?? "system";
  const notifPrefs = (preferences?.notification_prefs ?? {}) as unknown as NotificationPrefs;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--center-channel-color)" }}>
        Preferences
      </h1>

      <SidebarGroup title="Appearance" defaultOpen>
        <div className="space-y-4">
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
            >
              Theme
            </label>
            <div className="flex gap-2">
              {(["system", "light", "dark"] as ThemePreference[]).map((t) => (
                <Button
                  key={t}
                  variant={theme === t ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => handleThemeChange(t)}
                  disabled={saving}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
            >
              Clock format
            </label>
            <select
              value={preferences?.clock_format ?? "12h"}
              onChange={(e) => {
                const updated = { ...preferences, clock_format: e.target.value } as UserPreferences;
                setPreferences(updated);
              }}
              className="rounded-lg border px-3 py-2 text-sm focus-visible:outline-none"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
            >
              <option value="12h">12-hour (2:30 PM)</option>
              <option value="24h">24-hour (14:30)</option>
            </select>
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
            >
              Message display
            </label>
            <select
              value={preferences?.message_display ?? "standard"}
              onChange={(e) => {
                const updated = {
                  ...preferences,
                  message_display: e.target.value,
                } as UserPreferences;
                setPreferences(updated);
              }}
              className="rounded-lg border px-3 py-2 text-sm focus-visible:outline-none"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
            >
              <option value="standard">Standard (full profile)</option>
              <option value="compact">Compact (minimal)</option>
            </select>
          </div>
        </div>
      </SidebarGroup>

      <SidebarGroup title="Sidebar" defaultOpen>
        <div className="space-y-4">
          <ToggleRow
            label="Show channel display names"
            description="Display channel names instead of IDs in the sidebar"
            checked={preferences?.sidebar_show_display_name ?? true}
            onChange={(v) => {
              const updated = { ...preferences, sidebar_show_display_name: v } as UserPreferences;
              setPreferences(updated);
            }}
            disabled={saving}
          />
          <ToggleRow
            label="Sort channels alphabetically"
            description="Alphabetically sort channels within categories"
            checked={preferences?.sidebar_sort_alphabetical ?? false}
            onChange={(v) => {
              const updated = { ...preferences, sidebar_sort_alphabetical: v } as UserPreferences;
              setPreferences(updated);
            }}
            disabled={saving}
          />
        </div>
      </SidebarGroup>

      <SidebarGroup title="Notifications" defaultOpen>
        <div className="space-y-4">
          <ToggleRow
            label="Desktop notifications"
            description="Receive notifications in your browser"
            checked={notifPrefs.desktop_notifications ?? true}
            onChange={(v) => handleNotificationChange("desktop_notifications", v)}
            disabled={saving}
          />
          <ToggleRow
            label="Message notifications"
            description="Get notified when new messages are posted"
            checked={notifPrefs.message_notifications ?? true}
            onChange={(v) => handleNotificationChange("message_notifications", v)}
            disabled={saving}
          />
          <ToggleRow
            label="Mention notifications"
            description="Get notified when someone mentions you"
            checked={notifPrefs.mention_notifications ?? true}
            onChange={(v) => handleNotificationChange("mention_notifications", v)}
            disabled={saving}
          />
          <ToggleRow
            label="Mention notification sound"
            description="Play a sound when someone mentions you"
            checked={notifPrefs.mention_notification_sound ?? true}
            onChange={(v) => handleNotificationChange("mention_notification_sound", v)}
            disabled={saving}
          />
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
            >
              Notification sound
            </label>
            <select
              value={notifPrefs.sound ?? "standard"}
              onChange={(e) => handleNotificationChange("sound", e.target.value)}
              disabled={saving}
              className="rounded-lg border px-3 py-2 text-sm focus-visible:outline-none"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
            >
              <option value="none">None (silent)</option>
              <option value="subtle">Subtle</option>
              <option value="standard">Standard</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
            >
              Email notifications
            </label>
            <select
              value={notifPrefs.email_mode ?? "immediate"}
              onChange={(e) =>
                handleNotificationChange("email_mode", e.target.value)
              }
              disabled={saving}
              className="rounded-lg border px-3 py-2 text-sm focus-visible:outline-none"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
            >
              <option value="immediate">Immediate</option>
              <option value="digest">Digest (daily)</option>
              <option value="off">Off</option>
            </select>
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
            >
              Trigger words
            </label>
            <p
              className="mb-1 text-xs"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
            >
              You&#39;ll be notified when any of these words are mentioned (comma-separated)
            </p>
            <input
              type="text"
              value={(notifPrefs.trigger_words ?? []).join(", ")}
              onChange={(e) => {
                const words = e.target.value
                  .split(",")
                  .map((w) => w.trim())
                  .filter(Boolean);
                handleNotificationChange("trigger_words", words);
              }}
              disabled={saving}
              placeholder="e.g. deploy, urgent, bug"
              className="w-full rounded-lg border px-3 py-2 text-sm placeholder:text-[rgba(var(--center-channel-color-rgb),0.56)] focus-visible:outline-none"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
            />
          </div>
        </div>
      </SidebarGroup>

      {saveStatus !== "idle" && (
        <div
          className={`rounded-lg p-3 text-sm ${
            saveStatus === "success"
              ? "bg-[rgba(var(--online-indicator-rgb,6,214,160),0.12)] text-[var(--online-indicator)]"
              : "bg-[rgba(var(--dnd-indicator-rgb),0.12)] text-[var(--dnd-indicator)]"
          }`}
          role="alert"
        >
          {saveMessage}
        </div>
      )}

      <Button variant="primary" onClick={handleSaveAll} disabled={saving}>
        {saving ? "Saving..." : "Save Preferences"}
      </Button>

      <SidebarGroup title="Per-Channel Notifications" defaultOpen={false}>
        <p
          className="mb-2 text-xs"
          style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
        >
          Configure notification preferences for individual channels.
        </p>
        <div className="space-y-1">
          {channels.length === 0 && (
            <p className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
              No channels found
            </p>
          )}
          {channels.map((ch) => {
            const notify = channelPrefs.get(ch.id) ?? true;
            return (
              <div
                key={ch.id}
                className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
              >
                <span className="text-sm" style={{ color: "var(--center-channel-color)" }}>
                  # {ch.name}
                </span>
                <button
                  onClick={() => toggleChannelNotif(ch.id, notify)}
                  disabled={notifSaving === ch.id}
                  className={`flex h-7 w-7 items-center justify-center rounded-md ${
                    notify
                      ? "hover:bg-[rgba(var(--button-bg-rgb),0.12)]"
                      : "hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                  }`}
                  style={{
                    color: notify
                      ? "var(--button-bg)"
                      : "rgba(var(--center-channel-color-rgb), 0.56)",
                  }}
                  aria-label={notify ? `Mute ${ch.name}` : `Unmute ${ch.name}`}
                >
                  {notify ? <Bell size={14} /> : <BellOff size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      </SidebarGroup>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>
          {label}
        </p>
        <p className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
          {description}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative ml-4 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:outline-none`}
        style={{
          background: checked ? "var(--button-bg)" : "rgba(var(--center-channel-color-rgb), 0.08)",
        }}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
