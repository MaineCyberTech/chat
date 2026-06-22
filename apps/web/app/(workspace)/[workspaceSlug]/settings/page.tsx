"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { Button, SidebarGroup } from "@chat/ui";
import type { UserPreferences, ThemePreference } from "@chat/db";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;
    fetchPreferences();
  }, [authLoading]);

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

  async function savePreferences(patch: Partial<UserPreferences>) {
    if (!preferences) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      await api.patch("/preferences", patch);
      setSaveStatus("success");
      setSaveMessage("Preferences saved");
    } catch (err) {
      setSaveStatus("error");
      setSaveMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-foreground-tertiary)]">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  const theme = preferences?.theme ?? "system";

  return (
    <div className="mx-auto flex max-w-3xl space-y-8 p-6">
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
          <p className="text-sm text-[var(--color-foreground-tertiary)]">
            Notification preferences coming soon.
          </p>
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

      <Button
        variant="primary"
        onClick={() => savePreferences(preferences || {})}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  );
}
