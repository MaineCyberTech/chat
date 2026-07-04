"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { Button, SidebarGroup, useToast } from "@chat/ui";
import { Bell, BellOff } from "lucide-react";
import type { UserPreferences, ThemePreference } from "@chat/db";

interface NotificationPrefs {
  email_notifications: boolean;
  push_notifications: boolean;
  message_notifications: boolean;
  mention_notifications: boolean;
  digest: "never" | "daily" | "weekly";
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
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
    value: boolean | NotificationPrefs["digest"],
  ) {
    const current = (preferences?.notification_prefs ?? {}) as unknown as NotificationPrefs;
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
      notification_prefs: preferences.notification_prefs,
    });
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--color-foreground-tertiary)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border-primary)] border-t-[var(--color-brand-primary)]" />
        <span className="text-sm">Loading preferences...</span>
      </div>
    );
  }

  if (!user) return null;

  const theme = preferences?.theme ?? "system";
  const notifPrefs = (preferences?.notification_prefs ?? {}) as unknown as NotificationPrefs;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <h1 className="text-2xl font-bold text-[var(--color-foreground-primary)]">Preferences</h1>

      <SidebarGroup title="Appearance" defaultOpen>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-foreground-secondary)]">
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
        </div>
      </SidebarGroup>

      <SidebarGroup title="Notifications" defaultOpen>
        <div className="space-y-4">
          <ToggleRow
            label="Email notifications"
            description="Receive email notifications for important events"
            checked={notifPrefs.email_notifications ?? true}
            onChange={(v) => handleNotificationChange("email_notifications", v)}
            disabled={saving}
          />
          <ToggleRow
            label="Push notifications"
            description="Receive push notifications in your browser"
            checked={notifPrefs.push_notifications ?? true}
            onChange={(v) => handleNotificationChange("push_notifications", v)}
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
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-foreground-secondary)]">
              Email digest
            </label>
            <select
              value={notifPrefs.digest ?? "never"}
              onChange={(e) =>
                handleNotificationChange("digest", e.target.value as NotificationPrefs["digest"])
              }
              disabled={saving}
              className="rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-background-primary)] px-3 py-2 text-sm text-[var(--color-foreground-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
            >
              <option value="never">Never</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </SidebarGroup>

      {saveStatus !== "idle" && (
        <div
          className={`rounded-lg p-3 text-sm ${
            saveStatus === "success"
              ? "bg-[var(--color-status-success-bg)] text-[var(--color-status-success-fg)]"
              : "bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger-fg)]"
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
        <p className="mb-2 text-xs text-[var(--color-foreground-tertiary)]">
          Configure notification preferences for individual channels.
        </p>
        <div className="space-y-1">
          {channels.length === 0 && (
            <p className="text-xs text-[var(--color-foreground-tertiary)]">No channels found</p>
          )}
          {channels.map((ch) => {
            const notify = channelPrefs.get(ch.id) ?? true;
            return (
              <div
                key={ch.id}
                className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-[var(--color-background-tertiary)]"
              >
                <span className="text-sm text-[var(--color-foreground-primary)]"># {ch.name}</span>
                <button
                  onClick={() => toggleChannelNotif(ch.id, notify)}
                  disabled={notifSaving === ch.id}
                  className={`flex h-7 w-7 items-center justify-center rounded-md ${
                    notify
                      ? "text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-light)]"
                      : "text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)]"
                  }`}
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
        <p className="text-sm font-medium text-[var(--color-foreground-primary)]">{label}</p>
        <p className="text-xs text-[var(--color-foreground-tertiary)]">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative ml-4 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none ${
          checked ? "bg-[var(--color-button-primary-bg)]" : "bg-[var(--color-background-tertiary)]"
        }`}
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
