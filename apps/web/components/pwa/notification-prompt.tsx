"use client";

import React, { useEffect, useState } from "react";
import { pushClient } from "@/lib/pwa/push-client";
import { api } from "@/lib/api";
import { Button, Dialog } from "@chat/ui";

interface NotificationPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPrompt({ isOpen, onClose }: NotificationPromptProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, [isOpen]);

  async function checkSubscription() {
    try {
      const res = await api.get<{ subscriptions: Array<{ id: string }> }>(
        "/notifications/push-subscriptions",
      );
      setIsSubscribed(res.subscriptions.length > 0);
    } catch {
      console.warn("Failed to check subscription");
      /* ignore */
    }
  }

  async function handleEnable() {
    setIsSubscribing(true);
    setError(null);

    try {
      await pushClient.init();
      const subData = await pushClient.subscribe();
      if (subData) {
        await api.post("/notifications/push-subscriptions", subData);
        setIsSubscribed(true);
        onClose();
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to enable notifications");
    } finally {
      setIsSubscribing(false);
    }
  }

  async function handleDisable() {
    setIsSubscribing(true);
    try {
      const res = await api.get<{ subscriptions: Array<{ id: string }> }>(
        "/notifications/push-subscriptions",
      );
      const firstSub = res.subscriptions[0];
      if (firstSub) {
        await api.delete(`/notifications/push-subscriptions/${firstSub.id}`);
      }
      await pushClient.unsubscribe();
      setIsSubscribed(false);
      onClose();
    } catch {
      console.warn("Failed to disable notifications");
      /* ignore */
    } finally {
      setIsSubscribing(false);
    }
  }

  if (!isOpen) return null;

  const isSupported = pushClient.isSupported();
  const isDenied = permission === "denied";

  return (
    <Dialog open={isOpen} onClose={onClose} title="Push Notifications">
      <div className="space-y-4">
        {!isSupported && (
          <div className="text-center text-sm" style={{ color: "var(--dnd-indicator)" }}>
            Push notifications are not supported in this browser.
          </div>
        )}

        {isSupported && !isDenied && !isSubscribed && (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Get notified about new replies and mentions even when the app is closed.
            </p>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              You can change this later in settings.
            </p>
            {error && (
              <p className="text-sm" style={{ color: "var(--dnd-indicator)" }} role="alert">
                {error}
              </p>
            )}
            <Button
              variant="primary"
              className="w-full"
              onClick={handleEnable}
              disabled={isSubscribing || !isSupported}
            >
              {isSubscribing ? "Enabling..." : "Enable Notifications"}
            </Button>
          </div>
        )}

        {isSubscribed && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--center-channel-color)]">
                  Notifications Enabled
                </p>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  You'll receive push notifications for replies and mentions.
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: "rgba(var(--online-indicator-rgb,6,214,160),0.12)",
                  color: "var(--online-indicator)",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                Active
              </span>
            </div>
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleDisable}
              disabled={isSubscribing}
            >
              Disable Notifications
            </Button>
          </div>
        )}

        {isDenied && (
          <div className="space-y-3 text-center">
            <p className="text-sm" style={{ color: "var(--dnd-indicator)" }}>
              Notifications are blocked in your browser settings.
            </p>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Please enable notifications for this site in your browser settings, then try again.
            </p>
            <Button variant="secondary" className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
