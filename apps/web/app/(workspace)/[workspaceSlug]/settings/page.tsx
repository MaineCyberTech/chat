"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { Button, EmptyState, SidebarGroup, Skeleton, ToggleRow, useToast, useTheme } from "@chat/ui";
import { t } from "@/lib/i18n";
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
    document.title = t("settings.title");
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
  const [locale, setLocale] = useState("en");
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
  const resetDialogRef = useRef<HTMLDivElement>(null);
  const deleteDialogRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  async function handleResetPreferences() {
    setResetting(true);
    try {
      await api.delete("/preferences");
      setPreferences(null);
      setResetConfirmOpen(false);
      addToast({ title: t("settings.resetSuccess"), variant: "success", duration: 3000 });
    } catch {
      addToast({ title: t("common.error"), description: t("settings.saveFailed"), variant: "error" });
    } finally {
      setResetting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await api.delete("/auth/account");
      addToast({ title: t("settings.accountDeleted"), variant: "success", duration: 3000 });
      setTimeout(() => (window.location.href = "/sign-in"), 1500);
    } catch {
      addToast({ title: t("common.error"), description: t("settings.deleteFailed"), variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    setLocale(localStorage.getItem("chat-locale") ?? "en");
    fetchPreferences();
    fetchChannels();
    fetchTriggerWords();
    fetchAutoResponder();
  }, [authLoading]);

  useEffect(() => {
    if (!resetConfirmOpen) return;
    const prevFocus = document.activeElement as HTMLElement;
    const dialog = resetDialogRef.current;
    if (!dialog) return;
    const firstFocusable = dialog.querySelector<HTMLElement>("button");
    firstFocusable?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      e.preventDefault();
      const focusable = dialog.querySelectorAll<HTMLElement>("button");
      if (focusable.length < 2) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) last?.focus();
      else if (!e.shiftKey && document.activeElement === last) first?.focus();
    };
    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);
      prevFocus?.focus();
    };
  }, [resetConfirmOpen]);

  useEffect(() => {
    if (!deleteConfirmOpen) return;
    const prevFocus = document.activeElement as HTMLElement;
    const dialog = deleteDialogRef.current;
    if (!dialog) return;
    const firstFocusable = dialog.querySelector<HTMLElement>("button");
    firstFocusable?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      e.preventDefault();
      const focusable = dialog.querySelectorAll<HTMLElement>("button");
      if (focusable.length < 2) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) last?.focus();
      else if (!e.shiftKey && document.activeElement === last) first?.focus();
    };
    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);
      prevFocus?.focus();
    };
  }, [deleteConfirmOpen]);

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
      }>(`/auto-responder?workspace_id=${ws.id}`);
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
      await api.put("/auto-responder", {
        workspace_id: ws.id,
        enabled: autoResponderEnabled,
        message: autoResponderMessage,
      });
      addToast({ title: t("settings.autoResponderSaved"), variant: "success", duration: 2000 });
    } catch {
      addToast({ title: t("common.error"), description: t("settings.autoResponderSaveFailed"), variant: "error" });
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
      addToast({ title: t("settings.triggerWordAdded"), variant: "success", duration: 2000 });
    } catch (err) {
      addToast({
        title: t("settings.triggerWordAddFailed"),
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
      addToast({ title: t("settings.triggerWordRemoved"), variant: "success", duration: 2000 });
    } catch {
      addToast({ title: t("settings.triggerWordRemoveFailed"), variant: "error" });
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
      addToast({ title: t("settings.notificationPrefUpdateFailed"), variant: "error" });
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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      savePreferences(updated).catch(() => {});
    }, 300);
  }

  async function savePreferences(patch: Partial<UserPreferences>) {
    if (!preferences) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      await api.patch("/preferences", patch);
      setSaveStatus("success");
      setSaveMessage(t("settings.saved"));
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveStatus("error");
      setSaveMessage(err instanceof Error ? err.message : t("settings.saveFailed"));
    } finally {
      setSaving(false);
    }
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
          {t("common.retry")}
        </button>
      </div>
    );
  }

  if (!user) return null;

  const theme = preferences?.theme ?? "system";
  const notifPrefs = (preferences?.notification_prefs ?? {}) as unknown as NotificationPrefs;

  return (
    <div className="h-full overflow-y-auto px-4 py-2">
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--center-channel-color)" }}>
        {t("settings.title")}
      </h1>

      <SidebarGroup title={t("settings.appearance")} defaultOpen>
        <div className="space-y-4">
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("settings.theme")}
            </label>
            <div className="flex gap-2">
              {(["system", "light", "dark"] as ThemePreference[]).map((themeVal) => (
                <Button
                  key={themeVal}
                  variant={theme === themeVal ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => handleThemeChange(themeVal)}
                  disabled={saving}
                >
                  {themeVal === "light" ? t("settings.themeLight") : themeVal === "dark" ? t("settings.themeDark") : t("settings.themeSystem")}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("settings.clockFormat")}
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
              <option value="12h">{t("settings.clock12h")}</option>
              <option value="24h">{t("settings.clock24h")}</option>
            </select>
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("settings.messageDisplay")}
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
              <option value="standard">{t("settings.standard")}</option>
              <option value="compact">{t("settings.compact")}</option>
            </select>
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("settings.language")}
            </label>
            <select
              value={locale}
              onChange={(e) => {
                const newLocale = e.target.value;
                setLocale(newLocale);
                localStorage.setItem("chat-locale", newLocale);
                addToast({ title: t("settings.languageChanged"), variant: "success", duration: 500 });
                setTimeout(() => window.location.reload(), 500);
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

      <SidebarGroup title={t("settings.sidebar")} defaultOpen>
        <div className="space-y-4">
          <ToggleRow
            label={t("settings.sidebarShowDisplayName")}
            description={t("settings.sidebarShowDisplayNameDesc")}
            checked={preferences?.sidebar_show_display_name ?? true}
            onChange={(v) => {
              const updated = { ...preferences, sidebar_show_display_name: v } as UserPreferences;
              setPreferences(updated);
            }}
            disabled={saving}
          />
          <ToggleRow
            label={t("settings.sidebarSortAlphabetical")}
            description={t("settings.sidebarSortAlphabeticalDesc")}
            checked={preferences?.sidebar_sort_alphabetical ?? false}
            onChange={(v) => {
              const updated = { ...preferences, sidebar_sort_alphabetical: v } as UserPreferences;
              setPreferences(updated);
            }}
            disabled={saving}
          />
        </div>
      </SidebarGroup>

      <SidebarGroup title={t("settings.notifications")} defaultOpen>
        <div className="space-y-4">
          <ToggleRow
            label={t("settings.desktopNotifications")}
            description={t("settings.desktopNotificationsDesc")}
            checked={notifPrefs.desktop_notifications ?? true}
            onChange={(v) => handleNotificationChange("desktop_notifications", v)}
            disabled={saving}
          />
          <ToggleRow
            label={t("settings.messageNotifications")}
            description={t("settings.messageNotificationsDesc")}
            checked={notifPrefs.message_notifications ?? true}
            onChange={(v) => handleNotificationChange("message_notifications", v)}
            disabled={saving}
          />
          <ToggleRow
            label={t("settings.mentionNotifications")}
            description={t("settings.mentionNotificationsDesc")}
            checked={notifPrefs.mention_notifications ?? true}
            onChange={(v) => handleNotificationChange("mention_notifications", v)}
            disabled={saving}
          />
          <ToggleRow
            label={t("settings.mentionSound")}
            description={t("settings.mentionSound")}
            checked={notifPrefs.mention_notification_sound ?? true}
            onChange={(v) => handleNotificationChange("mention_notification_sound", v)}
            disabled={saving}
          />
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("settings.notificationSound")}
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
                <option value="none">{t("settings.soundNone")}</option>
                <option value="subtle">{t("settings.soundSubtle")}</option>
                <option value="standard">{t("settings.soundStandard")}</option>
                <option value="urgent">{t("settings.soundUrgent")}</option>
                <option value="chime">{t("settings.soundChime")}</option>
                <option value="bell">{t("settings.soundBell")}</option>
                <option value="ding">{t("settings.soundDing")}</option>
                <option value="pop">{t("settings.soundPop")}</option>
                <option value="tri-tone">{t("settings.soundTriTone")}</option>
              </select>
              <button
                onClick={() => playNotificationSound(notifPrefs.sound ?? "standard")}
                disabled={saving}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                style={{ color: "var(--button-bg)", border: "1px solid rgba(var(--center-channel-color-rgb), 0.16)" }}
                aria-label={t("settings.testSound")}
              >
                <Play size={14} />
                {t("settings.testSound")}
              </button>
            </div>
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("settings.emailNotifications")}
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
              <option value="immediate">{t("settings.emailImmediate")}</option>
              <option value="digest">{t("settings.emailDigest")}</option>
              <option value="off">{t("settings.emailOff")}</option>
            </select>
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("settings.triggerWords")}
            </label>
            <p className="mb-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
              {t("settings.triggerWordsDesc")}
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
                placeholder={t("settings.triggerWordPlaceholder")}
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
                {t("settings.triggerWordAdd")}
              </Button>
            </div>
            {triggerLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : triggerWords.length === 0 ? (
              <EmptyState description={t("settings.noTriggerWords")} className="!py-0" />
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
                      aria-label={t("common.remove") + " " + tw.word}
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

      <SidebarGroup title={t("settings.autoResponder")} defaultOpen={false}>
        <p className="mb-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
          {t("settings.autoResponderDesc")}
        </p>
        <div className="space-y-3">
          <ToggleRow
            label={t("settings.autoResponderEnabled")}
            description={t("settings.autoResponderHint")}
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
                  {t("settings.autoResponderMessageLabel")}
                </label>
                <textarea
                  value={autoResponderMessage}
                  onChange={(e) => setAutoResponderMessage(e.target.value)}
                  disabled={autoResponderSaving}
                  maxLength={500}
                  rows={3}
                  placeholder={t("settings.autoResponderPlaceholderMsg")}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus-visible:outline-none"
                  style={{
                    borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                    background: "var(--center-channel-bg)",
                    color: "var(--center-channel-color)",
                  }}
                />
                <span
                  className="text-xs"
                  style={{
                    color: autoResponderMessage.length > 400
                      ? "var(--error-text)"
                      : "var(--text-tertiary)",
                  }}
                >
                  {autoResponderMessage.length}/500
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={saveAutoResponder}
                disabled={autoResponderSaving}
              >
                {autoResponderSaving ? t("settings.saving") : t("settings.saveAutoResponder")}
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

      <SidebarGroup title={t("settings.perChannel")} defaultOpen={false}>
        <p className="mb-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
          {t("settings.perChannelDesc")}
        </p>
        <div className="space-y-1">
          {channels.length === 0 && (
            <EmptyState description={t("settings.noChannels")} className="!py-0" />
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
                  aria-label={(notify ? t("channel.mute") + " " : t("channel.unmute") + " ") + ch.name}
                >
                  {notify ? <Bell size={14} /> : <BellOff size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      </SidebarGroup>

      <SidebarGroup title={t("settings.dangerZone")} defaultOpen={false}>
        <p className="mb-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
          {t("settings.dangerZoneDesc")}
        </p>
        <div className="space-y-3">
          <div
            className="rounded-lg border p-3"
            style={{ borderColor: "rgba(var(--dnd-indicator-rgb), 0.3)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>
              {t("settings.resetPreferences")}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              {t("settings.resetPreferencesDesc")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResetConfirmOpen(true)}
              className="mt-2"
              style={{ color: "var(--dnd-indicator)" }}
            >
              {t("settings.resetPreferencesButton")}
            </Button>
          </div>
          <div
            className="rounded-lg border p-3"
            style={{ borderColor: "rgba(var(--dnd-indicator-rgb), 0.3)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>
              {t("settings.exportData")}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              {t("settings.exportDataDesc")}
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
                  addToast({ title: t("settings.exportComplete"), variant: "success" });
                } catch {
                  addToast({ title: t("settings.exportFailed"), variant: "error" });
                }
              }}
            >
              {t("settings.exportData")}
            </Button>
          </div>
          <div
            className="rounded-lg border p-3"
            style={{ borderColor: "rgba(var(--dnd-indicator-rgb), 0.3)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>
              {t("settings.deleteAccount")}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              {t("settings.deleteAccountDesc")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              className="mt-2"
              style={{ color: "var(--dnd-indicator)" }}
            >
              {t("settings.deleteAccountButton")}
            </Button>
          </div>
        </div>
      </SidebarGroup>

      {/* Reset preferences confirmation */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            ref={resetDialogRef}
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
              {t("settings.resetConfirmTitle")}
            </h3>
            <p className="mt-2 text-center text-xs" style={{ color: "var(--text-secondary)" }}>
              {t("settings.resetConfirmDesc")}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="rounded-md px-3 py-1.5 text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleResetPreferences}
                disabled={resetting}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: "var(--dnd-indicator)" }}
              >
                {resetting ? t("settings.resetting") : t("settings.reset")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account confirmation */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            ref={deleteDialogRef}
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
              {t("settings.deleteConfirmTitle")}
            </h3>
            <p className="mt-2 text-center text-xs" style={{ color: "var(--text-secondary)" }}>
              {t("settings.deleteConfirmDesc")}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="rounded-md px-3 py-1.5 text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: "var(--dnd-indicator)" }}
              >
                {deleting ? t("settings.deleting") : t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

// ToggleRow now imported from @chat/ui
