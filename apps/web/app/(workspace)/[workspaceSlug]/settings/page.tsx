"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { Button, EmptyState, SidebarGroup, Skeleton, useToast, useTheme } from "@chat/ui";
import { Bell, BellOff, AlertTriangle, X, Plus, Play } from "lucide-react";
import { playNotificationSound } from "@/lib/notification-sound";
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

  useEffect(() => {
    document.title = "Settings - Chat";
  }, []);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const { addToast } = useToast();
  const { setTheme: applyThemeSetting } = useTheme();
  const [channelPrefs, setChannelPrefs] = useState<Map<string, boolean>>(new Map());
  const [channels, setChannels] = useState<
    { id: string; workspace_id: string; name: string; slug: string }[]
  >([]);
  const [notifSaving, setNotifSaving] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [triggerWords, setTriggerWords] = useState<
    { id: string; word: string; created_at: string }[]
  >([]);
  const [newTriggerWord, setNewTriggerWord] = useState("");
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerSaving, setTriggerSaving] = useState(false);
  const [autoResponderEnabled, setAutoResponderEnabled] = useState(false);
  const [autoResponderMessage, setAutoResponderMessage] = useState("");
  const [autoResponderSaving, setAutoResponderSaving] = useState(false);

  async function handleResetPreferences() {
    setResetting(true);
    try {
      await api.delete("/preferences");
      setPreferences(null);
      setResetConfirmOpen(false);
      addToast({ title: "Preferences reset", variant: "success", duration: 3000 });
    } catch {
      addToast({ title: "Error", description: "Failed to reset preferences.", variant: "error" });
    } finally {
      setResetting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await api.delete("/auth/account");
      addToast({ title: "Account deleted", variant: "success", duration: 3000 });
      setTimeout(() => (window.location.href = "/sign-in"), 1500);
    } catch {
      addToast({ title: "Error", description: "Failed to delete account.", variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    fetchPreferences();
    fetchChannels();
    fetchTriggerWords();
    fetchAutoResponder();
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

  async function fetchAutoResponder() {
    try {
      const wsRes = await api.get<{ workspaces: { id: string }[] }>("/workspaces");
      const ws = wsRes.workspaces[0];
      if (!ws) return;
      const res = await api.get<{
        responder: { enabled: boolean; message: string; trigger_status: string[] };
      }>(`/status/auto-responder?workspace_id=${ws.id}`);
      setAutoResponderEnabled(res.responder.enabled);
      setAutoResponderMessage(res.responder.message);
    } catch {
      console.warn("Failed to fetch auto-responder");
    }
  }

  async function saveAutoResponder() {
    setAutoResponderSaving(true);
    try {
      const wsRes = await api.get<{ workspaces: { id: string }[] }>("/workspaces");
      const ws = wsRes.workspaces[0];
      if (!ws) return;
      await api.put("/status/auto-responder", {
        workspace_id: ws.id,
        enabled: autoResponderEnabled,
        message: autoResponderMessage,
      });
      addToast({ title: "Auto-responder saved", variant: "success", duration: 2000 });
    } catch {
      addToast({ title: "Error", description: "Failed to save auto-responder", variant: "error" });
    } finally {
      setAutoResponderSaving(false);
    }
  }

  async function fetchTriggerWords() {
    setTriggerLoading(true);
    try {
      const res = await api.get<{
        trigger_words: { id: string; word: string; created_at: string }[];
      }>("/notifications/trigger-words");
      setTriggerWords(res.trigger_words);
    } catch {
      console.warn("Failed to fetch trigger words");
    } finally {
      setTriggerLoading(false);
    }
  }

  async function addTriggerWord() {
    const word = newTriggerWord.trim();
    if (!word) return;
    setTriggerSaving(true);
    try {
      const res = await api.post<{
        trigger_word: { id: string; word: string; created_at: string };
      }>("/notifications/trigger-words", { word });
      setTriggerWords((prev) => [...prev, res.trigger_word]);
      setNewTriggerWord("");
      addToast({ title: "Trigger word added", variant: "success", duration: 2000 });
    } catch (err) {
      addToast({
        title: "Failed to add trigger word",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setTriggerSaving(false);
    }
  }

  async function deleteTriggerWord(id: string) {
    try {
      await api.delete(`/notifications/trigger-words/${id}`);
      setTriggerWords((prev) => prev.filter((tw) => tw.id !== id));
      addToast({ title: "Trigger word removed", variant: "success", duration: 2000 });
    } catch {
      addToast({ title: "Failed to remove trigger word", variant: "error" });
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

  async function handleThemeChange(t: ThemePreference) {
    const updated = { ...preferences, theme: t } as UserPreferences;
    setPreferences(updated);
    applyThemeSetting(t);
    await savePreferences({ theme: t });
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
    savePreferences(updated).catch(() => {});
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
        <p className="mb-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          {error}
        </p>
        <button
          onClick={() => {
            setError(null);
            fetchPreferences();
          }}
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
              style={{ color: "var(--text-secondary)" }}
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
              style={{ color: "var(--text-secondary)" }}
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
              style={{ color: "var(--text-secondary)" }}
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
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Language
            </label>
            <select
              value={typeof window !== "undefined" ? localStorage.getItem("chat-locale") ?? "en" : "en"}
              onChange={(e) => {
                localStorage.setItem("chat-locale", e.target.value);
                window.location.reload();
              }}
              className="rounded-lg border px-3 py-2 text-sm focus-visible:outline-none"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
            >
              <option value="en">English (en)</option>
              <option value="es">Spanish (es)</option>
              <option value="fr">French (fr)</option>
              <option value="de">German (de)</option>
              <option value="pt-BR">Portuguese (pt-BR)</option>
              <option value="ja">Japanese (ja)</option>
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
              style={{ color: "var(--text-secondary)" }}
            >
              Notification sound
            </label>
            <div className="flex gap-2">
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
                <option value="chime">Chime</option>
                <option value="bell">Bell</option>
                <option value="ding">Ding</option>
                <option value="pop">Pop</option>
                <option value="tri-tone">Tri-tone</option>
              </select>
              <button
                onClick={() => playNotificationSound(notifPrefs.sound ?? "standard")}
                disabled={saving}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                style={{ color: "var(--button-bg)", border: "1px solid rgba(var(--center-channel-color-rgb), 0.16)" }}
                aria-label="Test notification sound"
              >
                <Play size={14} />
                Test
              </button>
            </div>
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Email notifications
            </label>
            <select
              value={notifPrefs.email_mode ?? "immediate"}
              onChange={(e) => handleNotificationChange("email_mode", e.target.value)}
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
              style={{ color: "var(--text-secondary)" }}
            >
              Trigger words
            </label>
            <p className="mb-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Get notified when these words are mentioned in any channel
            </p>
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                value={newTriggerWord}
                onChange={(e) => setNewTriggerWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTriggerWord();
                }}
                disabled={triggerSaving}
                placeholder="e.g. deploy, urgent"
                className="flex-1 rounded-lg border px-3 py-2 text-sm placeholder:text-[rgba(var(--center-channel-color-rgb),0.56)] focus-visible:outline-none"
                style={{
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  background: "var(--center-channel-bg)",
                  color: "var(--center-channel-color)",
                }}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={addTriggerWord}
                disabled={triggerSaving || !newTriggerWord.trim()}
              >
                <Plus size={14} className="mr-1" />
                Add
              </Button>
            </div>
            {triggerLoading ? (
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Loading...
              </p>
            ) : triggerWords.length === 0 ? (
              <EmptyState description="No trigger words added yet" className="!py-0" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {triggerWords.map((tw) => (
                  <div
                    key={tw.id}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm"
                    style={{
                      background: "rgba(var(--button-bg-rgb), 0.1)",
                      color: "var(--button-bg)",
                    }}
                  >
                    {tw.word}
                    <button
                      onClick={() => deleteTriggerWord(tw.id)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-[rgba(var(--button-bg-rgb),0.2)]"
                      aria-label={`Remove ${tw.word}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarGroup>

      <SidebarGroup title="Auto-Responder" defaultOpen={false}>
        <p className="mb-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
          Auto-reply to direct messages when you&apos;re away or busy.
        </p>
        <div className="space-y-3">
          <ToggleRow
            label="Enable auto-responder"
            description="Automatically reply to DMs based on your status"
            checked={autoResponderEnabled}
            onChange={setAutoResponderEnabled}
            disabled={autoResponderSaving}
          />
          {autoResponderEnabled && (
            <>
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Auto-reply message
                </label>
                <textarea
                  value={autoResponderMessage}
                  onChange={(e) => setAutoResponderMessage(e.target.value)}
                  disabled={autoResponderSaving}
                  maxLength={500}
                  rows={3}
                  placeholder="I'm currently away. I'll get back to you soon."
                  className="w-full rounded-lg border px-3 py-2 text-sm focus-visible:outline-none"
                  style={{
                    borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                    background: "var(--center-channel-bg)",
                    color: "var(--center-channel-color)",
                  }}
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={saveAutoResponder}
                disabled={autoResponderSaving}
              >
                {autoResponderSaving ? "Saving..." : "Save Auto-Responder"}
              </Button>
            </>
          )}
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
        <p className="mb-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
          Configure notification preferences for individual channels.
        </p>
        <div className="space-y-1">
          {channels.length === 0 && (
            <EmptyState description="No channels found" className="!py-0" />
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
                    color: notify ? "var(--button-bg)" : "var(--text-tertiary)",
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

      <SidebarGroup title="Danger Zone" defaultOpen={false}>
        <p className="mb-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
          Destructive actions that cannot be undone.
        </p>
        <div className="space-y-3">
          <div
            className="rounded-lg border p-3"
            style={{ borderColor: "rgba(var(--dnd-indicator-rgb), 0.3)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>
              Reset all preferences
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Restore all settings to their default values.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResetConfirmOpen(true)}
              className="mt-2"
              style={{ color: "var(--dnd-indicator)" }}
            >
              Reset preferences
            </Button>
          </div>
          <div
            className="rounded-lg border p-3"
            style={{ borderColor: "rgba(var(--dnd-indicator-rgb), 0.3)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>
              Export data
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Download a JSON export of your messages.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              style={{ color: "var(--dnd-indicator)" }}
              onClick={async () => {
                try {
                  const res = await api.get("/export/messages?format=json");
                  const blob = new Blob([JSON.stringify(res, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "chat-export.json"; a.click();
                  URL.revokeObjectURL(url);
                  addToast({ title: "Export complete", variant: "success" });
                } catch {
                  addToast({ title: "Export failed", variant: "error" });
                }
              }}
            >
              Export data
            </Button>
          </div>
          <div
            className="rounded-lg border p-3"
            style={{ borderColor: "rgba(var(--dnd-indicator-rgb), 0.3)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>
              Delete account
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Permanently delete your account and all associated data.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              className="mt-2"
              style={{ color: "var(--dnd-indicator)" }}
            >
              Delete account
            </Button>
          </div>
        </div>
      </SidebarGroup>

      {/* Reset preferences confirmation */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="max-w-sm rounded-lg bg-[var(--center-channel-bg)] p-6 shadow-[var(--elevation-5)]"
            role="alertdialog"
          >
            <div
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "rgba(var(--dnd-indicator-rgb), 0.1)" }}
            >
              <AlertTriangle size={20} style={{ color: "var(--dnd-indicator)" }} />
            </div>
            <h3
              className="text-center text-sm font-semibold"
              style={{ color: "var(--center-channel-color)" }}
            >
              Reset preferences?
            </h3>
            <p className="mt-2 text-center text-xs" style={{ color: "var(--text-secondary)" }}>
              All your settings will be restored to their default values. This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="rounded-md px-3 py-1.5 text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleResetPreferences}
                disabled={resetting}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: "var(--dnd-indicator)" }}
              >
                {resetting ? "Resetting..." : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account confirmation */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="max-w-sm rounded-lg bg-[var(--center-channel-bg)] p-6 shadow-[var(--elevation-5)]"
            role="alertdialog"
          >
            <div
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "rgba(var(--dnd-indicator-rgb), 0.1)" }}
            >
              <AlertTriangle size={20} style={{ color: "var(--dnd-indicator)" }} />
            </div>
            <h3
              className="text-center text-sm font-semibold"
              style={{ color: "var(--center-channel-color)" }}
            >
              Delete account?
            </h3>
            <p className="mt-2 text-center text-xs" style={{ color: "var(--text-secondary)" }}>
              This will permanently delete your account and all associated data, including messages,
              channels, and workspaces. This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="rounded-md px-3 py-1.5 text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: "var(--dnd-indicator)" }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
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
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
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
